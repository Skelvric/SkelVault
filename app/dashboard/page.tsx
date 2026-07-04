'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, KeyRound } from 'lucide-react';
import Sidebar from '@/components/ui/SideBar';
import PasswordModal from '@/components/ui/PasswordModal';
import { Card, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Password } from '@/lib/types';
import { isWeakPassword } from '@/lib/passwordStrength';
import { cn } from '@/lib/cn';

export default function DashboardPage() {
	const [passwords, setPasswords] = useState<Password[]>([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		fetchPasswords();
	}, []);

	const fetchPasswords = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/passwords');
			const data = await res.json();
			setPasswords(Array.isArray(data) ? data : []);
		} catch {
			setPasswords([]);
		} finally {
			setLoading(false);
		}
	};

	const stats = useMemo(() => {
		const total = passwords.length;
		const categoryMap: Record<string, number> = {};
		let weak = 0;

		passwords.forEach((p) => {
			const cat = p.category || 'Other';
			categoryMap[cat] = (categoryMap[cat] || 0) + 1;
			if (isWeakPassword(p.password)) weak++;
		});

		const recent = [...passwords]
			.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
			.slice(0, 5);

		const score = total === 0 ? 100 : Math.max(0, Math.round(100 - (weak / total) * 100));

		return { total, categoryMap, weak, recent, score };
	}, [passwords]);

	if (loading) {
		return (
			<div className="min-h-[100dvh] bg-background flex">
				<Sidebar onAddPassword={() => setIsModalOpen(true)} />
				<main className="flex-1 md:ml-64 p-6 pt-24 sm:p-8 sm:pt-24 md:p-12 md:pt-12 space-y-8">
					<div className="space-y-2">
						<Skeleton className="h-9 w-64" />
						<Skeleton className="h-5 w-80" />
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{[0, 1, 2].map((i) => (
							<Skeleton key={i} className="h-24 rounded-2xl" />
						))}
					</div>
					<div className="grid md:grid-cols-2 gap-4">
						<Skeleton className="h-64 rounded-2xl" />
						<Skeleton className="h-64 rounded-2xl" />
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-[100dvh] bg-background flex">
			<Sidebar onAddPassword={() => setIsModalOpen(true)} />

			<main className="flex-1 md:ml-64 p-6 pt-24 sm:p-8 sm:pt-24 md:p-12 md:pt-12 space-y-8">
				<motion.header
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					className="space-y-1"
				>
					<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Security overview</h1>
					<p className="text-muted-foreground text-sm sm:text-base">
						Insights about your password vault.
					</p>
				</motion.header>

				<motion.section
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.05 }}
					className="grid grid-cols-1 sm:grid-cols-3 gap-4"
				>
					<Card>
						<CardContent className="p-5">
							<div className="flex items-center justify-between mb-2">
								<p className="text-muted-foreground text-sm">Total passwords</p>
								<KeyRound className="w-4 h-4 text-muted-foreground" />
							</div>
							<p className="text-3xl font-semibold">{stats.total}</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-5">
							<div className="flex items-center justify-between mb-2">
								<p className="text-muted-foreground text-sm">Weak passwords</p>
								<ShieldAlert className="w-4 h-4 text-muted-foreground" />
							</div>
							<p className={cn('text-3xl font-semibold', stats.weak > 0 && 'text-destructive')}>
								{stats.weak}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-5">
							<div className="flex items-center justify-between mb-2">
								<p className="text-muted-foreground text-sm">Security score</p>
								<ShieldCheck className="w-4 h-4 text-muted-foreground" />
							</div>
							<p className={cn('text-3xl font-semibold', stats.score > 70 ? 'text-success' : 'text-orange-500')}>
								{stats.score}
								<span className="text-lg text-muted-foreground">/100</span>
							</p>
						</CardContent>
					</Card>
				</motion.section>

				<motion.section
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.1 }}
					className="grid md:grid-cols-2 gap-4"
				>
					<Card>
						<CardContent className="p-5 sm:p-6">
							<h2 className="text-base font-medium mb-5">Categories</h2>
							{stats.total === 0 ? (
								<p className="text-sm text-muted-foreground">No entries yet.</p>
							) : (
								<div className="space-y-4">
									{Object.entries(stats.categoryMap).map(([key, value]) => (
										<div key={key} className="space-y-1.5">
											<div className="flex justify-between text-sm">
												<span>{key}</span>
												<span className="text-muted-foreground">{value}</span>
											</div>
											<div className="h-1.5 bg-muted rounded-full overflow-hidden">
												<motion.div
													initial={{ width: 0 }}
													animate={{ width: `${(value / stats.total) * 100}%` }}
													transition={{ duration: 0.6, ease: 'easeOut' }}
													className="h-full bg-primary rounded-full"
												/>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-5 sm:p-6">
							<h2 className="text-base font-medium mb-5">Recently added</h2>
							{stats.recent.length === 0 ? (
								<p className="text-sm text-muted-foreground">No entries yet.</p>
							) : (
								<div className="space-y-3.5">
									{stats.recent.map((p) => (
										<div key={p._id} className="flex items-center justify-between gap-3">
											<div className="min-w-0">
												<p className="text-sm font-medium truncate">{p.title}</p>
												<p className="text-xs text-muted-foreground truncate">{p.username}</p>
											</div>
											<span className="text-xs text-muted-foreground shrink-0">{p.category || 'Other'}</span>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</motion.section>

				<motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
					<Card>
						<CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div>
								<p className="text-sm text-muted-foreground">Vault health</p>
								<p className="text-lg font-medium">
									Everything looks{' '}
									<span className={stats.score > 70 ? 'text-success' : 'text-orange-500'}>
										{stats.total === 0 ? 'empty' : stats.score > 70 ? 'good' : 'like it needs attention'}
									</span>
								</p>
							</div>
							<div className="w-full sm:w-48 h-1.5 bg-muted rounded-full overflow-hidden">
								<motion.div
									initial={{ width: 0 }}
									animate={{ width: `${stats.score}%` }}
									transition={{ duration: 0.8, ease: 'easeOut' }}
									className={cn('h-full rounded-full', stats.score > 70 ? 'bg-success' : 'bg-orange-500')}
								/>
							</div>
						</CardContent>
					</Card>
				</motion.section>
			</main>
			<PasswordModal
				open={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={fetchPasswords}
			/>
		</div>
	);
}
