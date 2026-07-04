'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, User, Loader2, Save, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import Sidebar from '@/components/ui/SideBar';
import PasswordModal from '@/components/ui/PasswordModal';
import { Password } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import { PasswordStrengthMeter } from '@/components/ui/PasswordStrengthMeter';
import { SessionsCard } from '@/components/ui/SessionsCard';
import { apiFetch } from '@/lib/apiFetch';

interface UserProfile {
	_id: string;
	name: string;
	email: string;
	bio?: string;
	avatar?: string;
	phone?: string;
	company?: string;
	location?: string;
}

export default function ProfilePage() {
	const [user, setUser] = useState<UserProfile | null>(null);
	const [passwords, setPasswords] = useState<Password[]>([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [saving, setSaving] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const [form, setForm] = useState({ name: '', bio: '', phone: '', company: '', location: '' });

	const [changingPassword, setChangingPassword] = useState(false);
	const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
	const [passwordSaving, setPasswordSaving] = useState(false);

	useEffect(() => {
		fetchProfile();
		fetchPasswords();
	}, []);

	const fetchProfile = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/profile');
			if (!res.ok) throw new Error();
			const data = await res.json();
			setUser(data);
			setForm({
				name: data.name || '',
				bio: data.bio || '',
				phone: data.phone || '',
				company: data.company || '',
				location: data.location || '',
			});
		} catch {
			toast.error('Failed to load profile.');
		} finally {
			setLoading(false);
		}
	};

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

	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.name.trim()) {
			toast.error('Name cannot be empty.');
			return;
		}

		setSaving(true);
		try {
			const res = await apiFetch('/api/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(form),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Update failed');

			toast.success('Profile updated');
			fetchProfile();
		} catch (err: any) {
			toast.error(err.message || 'Failed to update profile.');
		} finally {
			setSaving(false);
		}
	};

	const handleAvatarClick = () => fileInputRef.current?.click();

	const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.type.startsWith('image/')) {
			toast.error('Please select an image file.');
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error('Image must be under 5MB.');
			return;
		}

		setUploadingAvatar(true);
		try {
			const formData = new FormData();
			formData.append('file', file);

			const res = await apiFetch('/api/profile/avatar', { method: 'POST', body: formData });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Upload failed');

			setUser((prev) => (prev ? { ...prev, avatar: data.avatar } : prev));
			toast.success('Avatar updated');
		} catch (err: any) {
			toast.error(err.message || 'Failed to upload avatar.');
		} finally {
			setUploadingAvatar(false);
			e.target.value = '';
		}
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			toast.error('New passwords do not match.');
			return;
		}
		if (passwordForm.newPassword.length < 8) {
			toast.error('New password must be at least 8 characters.');
			return;
		}

		setPasswordSaving(true);
		try {
			const res = await apiFetch('/api/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentPassword: passwordForm.currentPassword,
					newPassword: passwordForm.newPassword,
				}),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.error || 'Failed to change password');

			toast.success(data.message || 'Password changed successfully');
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
			setChangingPassword(false);
		} catch (err: any) {
			toast.error(err.message || 'Failed to change password.');
		} finally {
			setPasswordSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-[100dvh] bg-background">
				<Sidebar />
				<main className="flex-1 md:ml-64 p-6 pt-24 sm:p-8 sm:pt-24 md:p-12 md:pt-12 space-y-8">
					<Skeleton className="h-9 w-48" />
					<Skeleton className="h-64 rounded-2xl" />
					<Skeleton className="h-48 rounded-2xl" />
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-[100dvh] bg-background">
			<Sidebar onAddPassword={() => setIsModalOpen(true)} />

			<main className="flex-1 md:ml-64 p-6 pt-24 sm:p-8 sm:pt-24 md:p-12 md:pt-12 space-y-8">
				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
					<h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Profile settings</h1>
					<p className="text-muted-foreground text-sm mt-0.5">Manage your account information</p>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
					<Card className="mb-6">
						<CardContent className="p-5 sm:p-6">
							<div className="flex items-center gap-4">
								<div className="relative shrink-0">
									<div className="avatar-xl w-20 h-20">
										{user?.avatar ? (
											<img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
										) : (
											<User className="w-8 h-8 text-muted-foreground" />
										)}
									</div>
									<button
										onClick={handleAvatarClick}
										disabled={uploadingAvatar}
										className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm hover:bg-primary/90 active:bg-primary/90 transition-colors disabled:opacity-50"
										aria-label="Change avatar"
									>
										{uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
									</button>
									<input
										ref={fileInputRef}
										type="file"
										accept="image/*"
										className="hidden"
										onChange={handleAvatarChange}
									/>
								</div>
								<div className="min-w-0">
									<p className="font-medium truncate">{user?.name}</p>
									<p className="text-sm text-muted-foreground truncate">{user?.email}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
					<Card className="mb-6">
						<CardHeader>
							<CardTitle>Personal information</CardTitle>
							<CardDescription>Update your name and contact details</CardDescription>
						</CardHeader>
						<CardContent className="p-5 sm:p-6 pt-0">
							<form onSubmit={handleSaveProfile} className="space-y-4">
								<div className="space-y-1.5">
									<Label htmlFor="name">Name</Label>
									<Input
										id="name"
										value={form.name}
										onChange={(e) => setForm({ ...form, name: e.target.value })}
										required
									/>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="bio">Bio</Label>
									<Textarea
										id="bio"
										value={form.bio}
										onChange={(e) => setForm({ ...form, bio: e.target.value })}
										rows={3}
										maxLength={500}
									/>
								</div>

								<div className="grid sm:grid-cols-2 gap-4">
									<div className="space-y-1.5">
										<Label htmlFor="phone">Phone</Label>
										<Input
											id="phone"
											type="tel"
											inputMode="tel"
											value={form.phone}
											onChange={(e) => setForm({ ...form, phone: e.target.value })}
										/>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="company">Company</Label>
										<Input
											id="company"
											value={form.company}
											onChange={(e) => setForm({ ...form, company: e.target.value })}
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<Label htmlFor="location">Location</Label>
									<Input
										id="location"
										value={form.location}
										onChange={(e) => setForm({ ...form, location: e.target.value })}
									/>
								</div>

								<Button type="submit" loading={saving}>
									<Save className="w-4 h-4" /> Save changes
								</Button>
							</form>
						</CardContent>
					</Card>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
					<Card>
						<CardHeader>
							<CardTitle>Password</CardTitle>
							<CardDescription>Change your account's master password</CardDescription>
						</CardHeader>
						<CardContent className="p-5 sm:p-6 pt-0">
							{!changingPassword ? (
								<Button variant="outline" onClick={() => setChangingPassword(true)}>
									<KeyRound className="w-4 h-4" /> Change password
								</Button>
							) : (
								<form onSubmit={handleChangePassword} className="space-y-4">
									<div className="space-y-1.5">
										<Label htmlFor="currentPassword">Current password</Label>
										<Input
											id="currentPassword"
											type="password"
											value={passwordForm.currentPassword}
											onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
											autoComplete="current-password"
											required
										/>
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="newPassword">New password</Label>
										<Input
											id="newPassword"
											type="password"
											value={passwordForm.newPassword}
											onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
											autoComplete="new-password"
											required
										/>
										<PasswordStrengthMeter password={passwordForm.newPassword} />
									</div>
									<div className="space-y-1.5">
										<Label htmlFor="confirmNewPassword">Confirm new password</Label>
										<Input
											id="confirmNewPassword"
											type="password"
											value={passwordForm.confirmPassword}
											onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
											autoComplete="new-password"
											required
											error={
												passwordForm.confirmPassword.length > 0 &&
												passwordForm.confirmPassword !== passwordForm.newPassword
											}
										/>
									</div>
									<div className="flex gap-2">
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												setChangingPassword(false);
												setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
											}}
										>
											Cancel
										</Button>
										<Button type="submit" loading={passwordSaving}>
											Update password
										</Button>
									</div>
								</form>
							)}
						</CardContent>
					</Card>
				</motion.div>

				<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
					<SessionsCard />
				</motion.div>
			</main>
			<PasswordModal
				open={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={fetchPasswords}
			/>
		</div>
	);
}
