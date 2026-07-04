'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, Smartphone, Monitor, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiFetch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/AlertDialog';

interface SessionEntry {
	sessionId: string;
	userAgent: string;
	ip: string;
	createdAt: string;
	lastSeenAt: string;
	isCurrent: boolean;
}

function deviceIcon(userAgent: string) {
	const ua = userAgent.toLowerCase();
	if (/mobile|android|iphone/.test(ua)) return Smartphone;
	if (/macintosh|windows|linux/.test(ua) && !/mobile/.test(ua)) return Laptop;
	return Monitor;
}

function describeDevice(userAgent: string): string {
	const ua = userAgent;
	let browser = 'Unknown browser';
	if (/Edg\//.test(ua)) browser = 'Edge';
	else if (/Chrome\//.test(ua)) browser = 'Chrome';
	else if (/Firefox\//.test(ua)) browser = 'Firefox';
	else if (/Safari\//.test(ua)) browser = 'Safari';

	let os = 'Unknown device';
	if (/iPhone|iPad/.test(ua)) os = 'iOS';
	else if (/Android/.test(ua)) os = 'Android';
	else if (/Mac OS X/.test(ua)) os = 'macOS';
	else if (/Windows/.test(ua)) os = 'Windows';
	else if (/Linux/.test(ua)) os = 'Linux';

	return `${browser} on ${os}`;
}

function timeAgo(dateStr: string): string {
	const diffMs = Date.now() - new Date(dateStr).getTime();
	const minutes = Math.floor(diffMs / 60000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export function SessionsCard() {
	const [sessions, setSessions] = useState<SessionEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [revokingId, setRevokingId] = useState<string | null>(null);
	const [revokingOthers, setRevokingOthers] = useState(false);

	useEffect(() => {
		fetchSessions();
	}, []);

	const fetchSessions = async () => {
		setLoading(true);
		try {
			const res = await apiFetch('/api/sessions');
			if (!res.ok) throw new Error();
			const data = await res.json();
			setSessions(Array.isArray(data) ? data : []);
		} catch {
			toast.error('Failed to load active sessions.');
		} finally {
			setLoading(false);
		}
	};

	const revokeSession = async (sessionId: string) => {
		setRevokingId(sessionId);
		try {
			const res = await apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Failed to sign out device');

			setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
			toast.success('Device signed out');
		} catch (err: any) {
			toast.error(err.message || 'Failed to sign out device.');
		} finally {
			setRevokingId(null);
		}
	};

	const revokeOthers = async () => {
		setRevokingOthers(true);
		try {
			const res = await apiFetch('/api/sessions/revoke-others', { method: 'POST' });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Failed to sign out other devices');

			toast.success(data.message || 'Signed out of other devices');
			setSessions((prev) => prev.filter((s) => s.isCurrent));
		} catch (err: any) {
			toast.error(err.message || 'Failed to sign out other devices.');
		} finally {
			setRevokingOthers(false);
		}
	};

	const otherSessionsCount = sessions.filter((s) => !s.isCurrent).length;

	return (
		<Card>
			<CardHeader className="flex flex-col xs:flex-row xs:items-start justify-between gap-3 space-y-0">
				<div>
					<CardTitle>Active sessions</CardTitle>
					<CardDescription>Devices currently signed in to your vault</CardDescription>
				</div>
				{otherSessionsCount > 0 && (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="outline" size="sm" disabled={revokingOthers} className="w-full xs:w-auto shrink-0">
								{revokingOthers ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
								Sign out others
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Sign out of {otherSessionsCount} other device{otherSessionsCount === 1 ? '' : 's'}?</AlertDialogTitle>
								<AlertDialogDescription>
									This immediately ends every session except the one you're using right now.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={revokeOthers}>Sign out others</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)}
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="space-y-3">
						<Skeleton className="h-14 rounded-lg" />
						<Skeleton className="h-14 rounded-lg" />
					</div>
				) : sessions.length === 0 ? (
					<p className="text-sm text-muted-foreground">No active sessions found.</p>
				) : (
					<div className="space-y-2">
						<AnimatePresence initial={false}>
							{sessions.map((session) => {
								const Icon = deviceIcon(session.userAgent);
								return (
									<motion.div
										key={session.sessionId}
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										transition={{ duration: 0.2 }}
										className="flex items-center gap-3 bg-muted/50 rounded-lg px-3 py-2.5"
									>
										<div className="w-8 h-8 rounded-md bg-background border border-border flex items-center justify-center shrink-0">
											<Icon className="w-4 h-4 text-muted-foreground" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<p className="text-sm font-medium truncate">{describeDevice(session.userAgent)}</p>
												{session.isCurrent && (
													<Badge variant="success" className="text-[10px] shrink-0">
														This device
													</Badge>
												)}
											</div>
											<p className="text-xs text-muted-foreground truncate">
												{session.ip} · Active {timeAgo(session.lastSeenAt)}
											</p>
										</div>
										{!session.isCurrent && (
											<button
												onClick={() => revokeSession(session.sessionId)}
												disabled={revokingId === session.sessionId}
												className="text-muted-foreground hover:text-destructive active:text-destructive transition-colors shrink-0 p-2 -m-0.5 rounded-md hover:bg-destructive/10 active:bg-destructive/10"
												aria-label="Sign out this device"
											>
												{revokingId === session.sessionId ? (
													<Loader2 className="w-3.5 h-3.5 animate-spin" />
												) : (
													<LogOut className="w-3.5 h-3.5" />
												)}
											</button>
										)}
									</motion.div>
								);
							})}
						</AnimatePresence>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
