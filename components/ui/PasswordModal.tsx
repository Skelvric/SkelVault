'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, RefreshCcw } from 'lucide-react';
import { Password, PasswordFormData, PASSWORD_CATEGORIES } from '@/lib/types';

interface PasswordModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	editingPassword?: Password | null;
}

export default function PasswordModal({
	open,
	onClose,
	onSuccess,
	editingPassword,
}: PasswordModalProps) {
	const [form, setForm] = useState<PasswordFormData>({
		title: '',
		username: '',
		password: '',
		url: '',
		notes: '',
		category: 'Other',
	});

	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
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
			setForm({
				title: '',
				username: '',
				password: '',
				url: '',
				notes: '',
				category: 'Other',
			});
		}
	}, [editingPassword, open]);

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const generatePassword = () => {
		const chars =
			'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
		let pass = '';
		for (let i = 0; i < 16; i++) {
			pass += chars[Math.floor(Math.random() * chars.length)];
		}
		setForm({ ...form, password: pass });
	};

	const handleSubmit = async () => {
		setLoading(true);

		try {
			if (editingPassword) {
				await fetch(`/api/passwords/${editingPassword._id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(form),
				});
			} else {
				await fetch('/api/passwords', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(form),
				});
			}

			onSuccess();
			onClose();
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<AnimatePresence>
			{open && (
				<motion.div className="fixed inset-0 z-50 flex items-center justify-center">
					{/* Overlay */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className="absolute inset-0 bg-black/50"
					/>

					{/* Modal */}
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 z-10"
					>
						{/* Header */}
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-lg font-semibold">
								{editingPassword ? 'Edit Password' : 'Add Password'}
							</h2>
							<button onClick={onClose}>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Form */}
						<div className="space-y-3">
							<input
								name="title"
								placeholder="Title"
								value={form.title}
								onChange={handleChange}
								className="w-full p-2 border rounded-lg"
							/>

							<input
								name="username"
								placeholder="Username"
								value={form.username}
								onChange={handleChange}
								className="w-full p-2 border rounded-lg"
							/>

							{/* Password */}
							<div className="flex gap-2">
								<input
									name="password"
									type={showPassword ? 'text' : 'password'}
									placeholder="Password"
									value={form.password}
									onChange={handleChange}
									className="w-full p-2 border rounded-lg"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="p-2 border rounded-lg"
								>
									{showPassword ? (
										<EyeOff className="w-4 h-4" />
									) : (
										<Eye className="w-4 h-4" />
									)}
								</button>
								<button
									type="button"
									onClick={generatePassword}
									className="p-2 border rounded-lg"
								>
									<RefreshCcw className="w-4 h-4" />
								</button>
							</div>

							<input
								name="url"
								placeholder="Website URL"
								value={form.url}
								onChange={handleChange}
								className="w-full p-2 border rounded-lg"
							/>

							<select
								name="category"
								value={form.category}
								onChange={handleChange}
								className="w-full p-2 border rounded-lg"
							>
								{PASSWORD_CATEGORIES.map((cat) => (
									<option key={cat} value={cat}>
										{cat}
									</option>
								))}
							</select>

							<textarea
								name="notes"
								placeholder="Notes"
								value={form.notes}
								onChange={handleChange}
								className="w-full p-2 border rounded-lg"
							/>
						</div>

						{/* Actions */}
						<div className="flex justify-end gap-2 mt-4">
							<button
								onClick={onClose}
								className="px-4 py-2 border rounded-lg"
							>
								Cancel
							</button>
							<button
								onClick={handleSubmit}
								disabled={loading}
								className="px-4 py-2 bg-black text-white rounded-lg"
							>
								{loading ? 'Saving...' : 'Save'}
							</button>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
