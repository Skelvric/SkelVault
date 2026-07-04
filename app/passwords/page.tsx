'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Download, Upload, X, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '@/components/ui/SideBar';
import PasswordCard from '@/components/ui/PasswordCard';
import PasswordModal from '@/components/ui/PasswordModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/Select';
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/AlertDialog';
import { Password, PASSWORD_CATEGORIES } from '@/lib/types';
import { apiFetch } from '@/lib/apiFetch';

export default function PasswordsPage() {
	const [passwords, setPasswords] = useState<Password[]>([]);
	const [loading, setLoading] = useState(true);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingPassword, setEditingPassword] = useState<Password | null>(null);

	const [search, setSearch] = useState('');
	const [category, setCategory] = useState<string>('all');

	const [exporting, setExporting] = useState(false);
	const [importing, setImporting] = useState(false);
	const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		fetchPasswords();
	}, []);

	const fetchPasswords = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/passwords');
			const data = await res.json();
			setPasswords(Array.isArray(data) ? data : []);
		} catch (err) {
			toast.error('Failed to load passwords.');
			setPasswords([]);
		} finally {
			setLoading(false);
		}
	};

	const filtered = useMemo(() => {
		return passwords.filter((p) => {
			const matchesSearch =
				!search ||
				p.title.toLowerCase().includes(search.toLowerCase()) ||
				p.username.toLowerCase().includes(search.toLowerCase()) ||
				(p.url || '').toLowerCase().includes(search.toLowerCase());
			const matchesCategory = category === 'all' || (p.category || 'Other') === category;
			return matchesSearch && matchesCategory;
		});
	}, [passwords, search, category]);

	const handleDelete = async (id: string) => {
		const prev = passwords;
		setPasswords((p) => p.filter((x) => x._id !== id));

		try {
			const res = await apiFetch(`/api/passwords/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error(data.error || 'Delete failed');
			}
			toast.success('Password deleted');
		} catch (err: any) {
			setPasswords(prev);
			toast.error(err.message || 'Failed to delete password.');
		}
	};

	const handleEdit = (password: Password) => {
		setEditingPassword(password);
		setIsModalOpen(true);
	};

	const handleAdd = () => {
		setEditingPassword(null);
		setIsModalOpen(true);
	};

	const handleExport = async () => {
		setExporting(true);
		try {
			const res = await fetch('/api/passwords?export=json');
			if (!res.ok) throw new Error('Export failed');

			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `SkelVault-Export-${new Date().toISOString().slice(0, 10)}.json`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
			toast.success('Vault exported', {
				description: 'Keep this file safe — it contains your passwords in plain text.',
			});
		} catch {
			toast.error('Failed to export vault.');
		} finally {
			setExporting(false);
		}
	};

	const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) setPendingImportFile(file);
		e.target.value = '';
	};

	const runImport = async (mode: 'Merge' | 'Replace') => {
		if (!pendingImportFile) return;
		setImporting(true);

		try {
			const text = await pendingImportFile.text();
			const json = JSON.parse(text);

			const res = await apiFetch(`/api/passwords/import?mode=${mode}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(json),
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Import failed');

			toast.success(`Imported ${data.imported} entr${data.imported === 1 ? 'y' : 'ies'}`, {
				description: data.skipped > 0 ? `${data.skipped} entries were skipped (missing title/password).` : undefined,
			});
			fetchPasswords();
		} catch (err: any) {
			toast.error(err.message === 'Unexpected token' || err instanceof SyntaxError
				? 'That file is not valid JSON.'
				: err.message || 'Import failed.');
		} finally {
			setImporting(false);
			setPendingImportFile(null);
		}
	};

	return (
		<div className="min-h-[100dvh] bg-background flex">
			<Sidebar onAddPassword={handleAdd} />

			<main className="flex-1 md:ml-64 p-6 pt-24 sm:p-8 sm:pt-24 md:p-12 md:pt-12">
				<motion.header
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					className="flex flex-col gap-4 mb-8"
				>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Passwords</h1>
							<p className="text-muted-foreground text-sm mt-0.5">
								{passwords.length} {passwords.length === 1 ? 'entry' : 'entries'} in your vault
							</p>
						</div>

						<div className="grid grid-cols-3 xs:flex xs:flex-wrap items-center gap-2">
							<input
								ref={fileInputRef}
								type="file"
								accept="application/json"
								className="hidden"
								onChange={handleFileSelected}
							/>
							<Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} loading={importing}>
								<Upload className="w-3.5 h-3.5" />
								<span className="hidden xs:inline">Import</span>
							</Button>
							<Button variant="outline" size="sm" onClick={handleExport} loading={exporting} disabled={passwords.length === 0}>
								<Download className="w-3.5 h-3.5" />
								<span className="hidden xs:inline">Export</span>
							</Button>
							<Button size="sm" onClick={handleAdd}>
								<Plus className="w-3.5 h-3.5" />
								Add
							</Button>
						</div>
					</div>

					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search by title, username, or URL…"
								inputMode="search"
								enterKeyHint="search"
								className="pl-9 pr-9"
							/>
							{search && (
								<button
									onClick={() => setSearch('')}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1.5 -m-1.5 rounded-md active:bg-accent transition-colors"
									aria-label="Clear search"
								>
									<X className="w-4 h-4" />
								</button>
							)}
						</div>

						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger className="sm:w-44">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All categories</SelectItem>
								{PASSWORD_CATEGORIES.map((cat) => (
									<SelectItem key={cat} value={cat}>
										{cat}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</motion.header>

				{loading ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{[0, 1, 2, 3, 4, 5].map((i) => (
							<Skeleton key={i} className="h-52 rounded-xl" />
						))}
					</div>
				) : filtered.length === 0 ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="flex flex-col items-center justify-center py-24 text-center"
					>
						<div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
							<Inbox className="w-5 h-5 text-muted-foreground" />
						</div>
						<p className="font-medium">
							{passwords.length === 0 ? 'Your vault is empty' : 'No matches found'}
						</p>
						<p className="text-sm text-muted-foreground mt-1 max-w-xs">
							{passwords.length === 0
								? 'Add your first password to get started.'
								: 'Try a different search term or category.'}
						</p>
						{passwords.length === 0 && (
							<Button className="mt-4" onClick={handleAdd}>
								<Plus className="w-4 h-4" /> Add password
							</Button>
						)}
					</motion.div>
				) : (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						<AnimatePresence mode="popLayout">
							{filtered.map((p, i) => (
								<PasswordCard key={p._id} password={p} onEdit={handleEdit} onDelete={handleDelete} index={i} />
							))}
						</AnimatePresence>
					</div>
				)}
			</main>

			<PasswordModal
				open={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={fetchPasswords}
				editingPassword={editingPassword}
			/>

			<AlertDialog open={!!pendingImportFile} onOpenChange={(v) => !v && setPendingImportFile(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Import "{pendingImportFile?.name}"</AlertDialogTitle>
						<AlertDialogDescription>
							Merge adds these entries alongside your existing passwords. Replace deletes
							everything currently in your vault first — this can't be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="sm:justify-between">
						<AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
						<div className="flex flex-col-reverse xs:flex-row gap-2">
							<Button variant="outline" className="w-full xs:w-auto" onClick={() => runImport('Merge')} loading={importing}>
								Merge
							</Button>
							<Button variant="destructive" className="w-full xs:w-auto" onClick={() => runImport('Replace')} loading={importing}>
								Replace all
							</Button>
						</div>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
