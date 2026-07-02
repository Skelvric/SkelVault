'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/ui/SideBar';
import PasswordCard from '../../components/ui/PasswordCard';
import PasswordModal from '../../components/ui/PasswordModal';
import { Password } from '../../lib/types';

export default function PasswordsPage() {
	const [passwords, setPasswords] = useState<Password[]>([]);
	const [loading, setLoading] = useState(true);

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingPassword, setEditingPassword] =
		useState<Password | null>(null);

	const [search, setSearch] = useState('');

	useEffect(() => {
		fetchPasswords();
	}, []);

	const fetchPasswords = async () => {
		setLoading(true);

		try {
			const res = await fetch('/api/passwords', {
				credentials: 'include',
			});

			const data = await res.json();
			setPasswords(Array.isArray(data) ? data : []);
		} catch (err) {
			console.error(err);
			setPasswords([]);
		} finally {
			setLoading(false);
		}
	};

	const handleExport = async () => {
		try {
			const res = await fetch('/api/passwords?export=json', {
				credentials: 'include',
			});

			if (!res.ok) throw new Error('Export failed');

			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `passwords-export-${new Date().toISOString().slice(0,10)}.json`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
		} catch (err) {
			alert('An error occurred during export.');
			console.error(err);
		}
	};

	const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.name.endsWith('.json')) {
			alert('Please select only .json files.');
			return;
		}

		const reader = new FileReader();
		reader.onload = async (event) => {
			try {
				const jsonData = JSON.parse(event.target?.result as string);
				
				const res = await fetch('/api/passwords', {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(jsonData),
					credentials: 'include',
				});

				if (res.ok) {
					alert('Passwords imported successfully!');
					fetchPasswords(); // Refresh the list
				} else {
					const errorData = await res.json().catch(() => ({}));
					alert(`Error: ${errorData.error || 'Import failed.'}`);
				}
			} catch (err) {
				alert('Invalid JSON file! Please select a correct export file.');
				console.error(err);
			}
		};
		reader.readAsText(file);

		e.target.value = '';
	};

	const handleDelete = async (id: string) => {
		await fetch(`/api/passwords/${id}`, {
			method: 'DELETE',
			credentials: 'include',
		});

		fetchPasswords();
	};

	const filteredPasswords = useMemo(() => {
		return passwords.filter((p) =>
			`${p.title} ${p.username}`
				.toLowerCase()
				.includes(search.toLowerCase())
		);
	}, [passwords, search]);

	if (loading) {
		return (
			<div className="min-h-screen bg-slate-50 flex items-center justify-center">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ repeat: Infinity, duration: 1 }}
					className="w-9 h-9 border-2 border-slate-900 border-t-transparent rounded-full"
				/>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 flex">
			<Sidebar
				onAddPassword={() => {
					setEditingPassword(null);
					setIsModalOpen(true);
				}}
			/>

			<main className="flex-1 ml-0 md:ml-64 p-8 md:p-12 space-y-10">

				{/* Header */}
				<header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
					<div className="space-y-2">
						<h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
							Password Vault
						</h1>
						<p className="text-slate-500">
							Manage and secure your credentials in one place.
						</p>
					</div>

					<div className="flex items-center gap-3 flex-wrap">
						<input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search passwords..."
							className="w-full md:w-72 px-4 py-2 rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
						/>

						{/* Import Button */}
						<label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm cursor-pointer transition flex items-center gap-2">
							Import JSON
							<input
								type="file"
								accept=".json"
								onChange={handleImport}
								className="hidden"
							/>
						</label>

						{/* Export Button */}
						<button
							onClick={handleExport}
							className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm transition flex items-center gap-2"
						>
							Export JSON
						</button>
					</div>
				</header>

				{/* Content */}
				{filteredPasswords.length === 0 ? (
					<div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
						<h2 className="text-xl font-medium text-slate-900">
							No passwords found
						</h2>
						<p className="text-slate-500 mt-2">
							Start by adding your first secure credential.
						</p>

						<button
							onClick={() => {
								setEditingPassword(null);
								setIsModalOpen(true);
							}}
							className="mt-6 px-5 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition"
						>
							Add Password
						</button>
					</div>
				) : (
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{filteredPasswords.map((p, index) => (
							<PasswordCard
								key={p._id}
								password={p}
								index={index}
								onEdit={(pw) => {
									setEditingPassword(pw);
									setIsModalOpen(true);
								}}
								onDelete={handleDelete}
							/>
						))}
					</div>
				)}

			</main>

			<PasswordModal
				open={isModalOpen}
				editingPassword={editingPassword}
				onClose={() => setIsModalOpen(false)}
				onSuccess={fetchPasswords}
			/>
		</div>
	);
}
