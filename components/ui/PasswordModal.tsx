'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Password, PasswordFormData, PASSWORD_CATEGORIES } from '@/lib/types';
import { apiFetch } from '@/lib/apiFetch';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/Select';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';

interface PasswordModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editingPassword?: Password | null;
}

const EMPTY_FORM: PasswordFormData = {
	title: '',
	username: '',
	password: '',
	url: '',
	notes: '',
	category: 'Other',
};

export default function PasswordModal({ open, onClose, onSuccess, editingPassword }: PasswordModalProps) {
	const [form, setForm] = useState<PasswordFormData>(EMPTY_FORM);
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		if (!open) return;
		if (editingPassword) {
			setForm({
				title: editingPassword.title || '',
				username: editingPassword.username || '',
				password: editingPassword.password || '',
				url: editingPassword.url || '',
				notes: editingPassword.notes || '',
				category: editingPassword.category || 'Other',
			});
		} else {
			setForm(EMPTY_FORM);
		}
		setErrors({});
		setShowPassword(false);
	}, [editingPassword, open]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		setForm({ ...form, [e.target.name]: e.target.value });
		if (errors[e.target.name]) {
			setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
		}
	};

	const generatePassword = () => {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
		const array = new Uint32Array(18);
		crypto.getRandomValues(array);
		let pass = '';
		for (let i = 0; i < 18; i++) {
			pass += chars[array[i] % chars.length];
		}
		setForm({ ...form, password: pass });
		setShowPassword(true);
	};

	const validate = (): boolean => {
		const next: Record<string, string> = {};
		if (!form.title.trim()) next.title = 'Title is required.';
		if (!form.username.trim()) next.username = 'Username is required.';
		if (!form.password) next.password = 'Password is required.';
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setLoading(true);

		try {
			const url = editingPassword ? `/api/passwords/${editingPassword._id}` : '/api/passwords';
			const method = editingPassword ? 'PUT' : 'POST';

			const res = await apiFetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
			});

			const data = await res.json().catch(() => ({}));

			if (!res.ok) {
				toast.error(data.error || 'Something went wrong. Please try again.');
				return;
			}

			toast.success(editingPassword ? 'Password updated' : 'Password added');
			onSuccess();
			onClose();
		} catch (error) {
			toast.error('Network error. Please check your connection and try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={(v) => !v && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{editingPassword ? 'Edit password' : 'Add password'}</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							name="title"
							placeholder="e.g. Personal Gmail"
							value={form.title}
							onChange={handleChange}
							error={!!errors.title}
						/>
						{errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="username">Username or email</Label>
						<Input
							id="username"
							name="username"
							autoCapitalize="none"
							autoCorrect="off"
							spellCheck={false}
							placeholder="you@example.com"
							value={form.username}
							onChange={handleChange}
							error={!!errors.username}
						/>
						{errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="password">Password</Label>
						<div className="flex gap-2">
							<div className="relative flex-1">
								<Input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Password"
									value={form.password}
									onChange={handleChange}
									error={!!errors.password}
									className="pr-9"
									autoComplete="new-password"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
									aria-label={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
								</button>
							</div>
							<Button type="button" variant="outline" size="icon" onClick={generatePassword} aria-label="Generate password">
								<RefreshCcw className="w-4 h-4" />
							</Button>
						</div>
						{errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
						<PasswordStrengthMeter password={form.password} />
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="url">Website URL</Label>
						<Input
							id="url"
							name="url"
							type="url"
							inputMode="url"
							autoCapitalize="none"
							autoCorrect="off"
							placeholder="example.com"
							value={form.url}
							onChange={handleChange}
						/>
					</div>

					<div className="space-y-1.5">
						<Label>Category</Label>
						<Select
							value={form.category}
							onValueChange={(value) => setForm({ ...form, category: value })}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PASSWORD_CATEGORIES.map((cat) => (
									<SelectItem key={cat} value={cat}>
										{cat}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="notes">Notes</Label>
						<Textarea
							id="notes"
							name="notes"
							placeholder="Optional notes"
							value={form.notes}
							onChange={handleChange}
							rows={3}
						/>
					</div>

					<DialogFooter className="pt-2">
						<Button type="button" variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button type="submit" loading={loading}>
							{loading ? 'Saving…' : 'Save'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
