'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
	Eye,
	EyeOff,
	Copy,
	Trash2,
	Edit2,
	Check,
	ExternalLink,
	AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Password } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
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
import { isWeakPassword } from '@/lib/passwordStrength';

interface Props {
	password: Password;
	onEdit: (p: Password) => void;
	onDelete: (id: string) => void;
	index: number;
}

export default function PasswordCard({ password, onEdit, onDelete, index }: Props) {
	const [show, setShow] = useState(false);
	const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);
	const [deleting, setDeleting] = useState(false);

	const weak = isWeakPassword(password.password);

	const copy = async (text: string, field: 'username' | 'password') => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedField(field);
			toast.success(field === 'password' ? 'Password copied' : 'Username copied', {
				description: field === 'password' ? 'Clears from clipboard in 30s.' : undefined,
			});
			setTimeout(() => setCopiedField(null), 1500);

			// Best-effort clipboard auto-clear for sensitive values, so a copied
			// secret doesn't linger indefinitely if the user forgets about it.
			if (field === 'password') {
				setTimeout(async () => {
					try {
						const current = await navigator.clipboard.readText();
						if (current === text) {
							await navigator.clipboard.writeText('');
						}
					} catch {
						// Clipboard read permission may be denied — safe to ignore.
					}
				}, 30000);
			}
		} catch {
			toast.error('Could not access clipboard.');
		}
	};

	const handleDelete = async () => {
		setDeleting(true);
		try {
			await onDelete(password._id!);
		} finally {
			setDeleting(false);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3 }}
			layout
			className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
		>
			<div className="flex justify-between items-start gap-2">
				<div className="min-w-0">
					<div className="flex items-center gap-1.5">
						<h3 className="font-medium truncate">{password.title}</h3>
						{weak && (
							<span title="Weak password">
								<AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
							</span>
						)}
					</div>
					<Badge variant="outline" className="mt-1 text-[10px]">
						{password.category || 'Other'}
					</Badge>
				</div>

				<div className="flex gap-0.5 shrink-0">
					<button
						onClick={() => onEdit(password)}
						className="p-2 -m-0.5 rounded-md hover:bg-accent active:bg-accent transition-colors text-muted-foreground hover:text-foreground"
						aria-label="Edit"
					>
						<Edit2 className="w-3.5 h-3.5" />
					</button>

					<AlertDialog>
						<AlertDialogTrigger asChild>
							<button
								className="p-2 -m-0.5 rounded-md hover:bg-destructive/10 active:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
								aria-label="Delete"
							>
								<Trash2 className="w-3.5 h-3.5" />
							</button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete "{password.title}"?</AlertDialogTitle>
								<AlertDialogDescription>
									This can't be undone. The entry will be permanently removed from your vault.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={handleDelete} disabled={deleting}>
									{deleting ? 'Deleting…' : 'Delete'}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>

			<div className="mt-3 space-y-2">
				<div>
					<p className="text-xs text-muted-foreground mb-1">Username</p>
					<div className="flex items-center justify-between bg-muted/60 px-2.5 py-1.5 rounded-lg">
						<span className="text-sm truncate">{password.username || '—'}</span>
						<button
							onClick={() => copy(password.username, 'username')}
							className="text-muted-foreground hover:text-foreground shrink-0 ml-2 p-1.5 -m-1.5 rounded-md active:bg-accent transition-colors"
							aria-label="Copy username"
						>
							{copiedField === 'username' ? (
								<Check className="w-3.5 h-3.5 text-success" />
							) : (
								<Copy className="w-3.5 h-3.5" />
							)}
						</button>
					</div>
				</div>

				<div>
					<p className="text-xs text-muted-foreground mb-1">Password</p>
					<div className="flex items-center justify-between bg-muted/60 px-2.5 py-1.5 rounded-lg">
						<span className="text-sm font-mono-tight truncate">
							{show ? password.password : '••••••••••'}
						</span>
						<div className="flex items-center gap-1 shrink-0 ml-2">
							<button
								onClick={() => setShow(!show)}
								className="text-muted-foreground hover:text-foreground p-1.5 -m-1.5 rounded-md active:bg-accent transition-colors"
								aria-label={show ? 'Hide password' : 'Show password'}
							>
								{show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
							</button>
							<button
								onClick={() => copy(password.password, 'password')}
								className="text-muted-foreground hover:text-foreground p-1.5 -m-1.5 rounded-md active:bg-accent transition-colors"
								aria-label="Copy password"
							>
								{copiedField === 'password' ? (
									<Check className="w-3.5 h-3.5 text-success" />
								) : (
									<Copy className="w-3.5 h-3.5" />
								)}
							</button>
						</div>
					</div>
				</div>

				{password.notes && (
					<div>
						<p className="text-xs text-muted-foreground mb-1">Notes</p>
						<div className="bg-muted/60 px-2.5 py-1.5 rounded-lg text-sm text-foreground/80 whitespace-pre-wrap break-words">
							{password.notes}
						</div>
					</div>
				)}

				{password.url && (
					<a
						href={/^https?:\/\//i.test(password.url) ? password.url : `https://${password.url}`}
						target="_blank"
						rel="noopener noreferrer nofollow"
						className="flex items-center justify-between mt-1 text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors group py-1"
					>
						<span className="truncate">{password.url}</span>
						<ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
					</a>
				)}
			</div>
		</motion.div>
	);
}
