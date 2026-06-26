'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
	Eye,
	EyeOff,
	Copy,
	Trash2,
	Edit2,
	CheckCircle2,
	ExternalLink,
} from 'lucide-react';
import { Password } from '@/lib/types';

interface Props {
	password: Password;
	onEdit: (p: Password) => void;
	onDelete: (id: string) => void;
	index: number;
}

export default function PasswordCard({
	password,
	onEdit,
	onDelete,
	index,
}: Props) {
	const [show, setShow] = useState(false);
	const [copiedField, setCopiedField] = useState<
		'username' | 'password' | null
	>(null);

	const copy = async (
		text: string,
		field: 'username' | 'password'
	) => {
		await navigator.clipboard.writeText(text);

		setCopiedField(field);

		setTimeout(() => setCopiedField(null), 1500);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.05 }}
			className="bg-white border rounded-xl p-4 hover:shadow-lg transition"
		>
			{/* Header */}
			<div className="flex justify-between">
				<div>
					<h3 className="font-semibold">{password.title}</h3>
					<p className="text-xs text-slate-500">
						{password.category}
					</p>
				</div>

				<div className="flex gap-2">
					<button onClick={() => onEdit(password)}>
						<Edit2 className="w-4 h-4" />
					</button>

					<button
						onClick={() => {
							if (confirm('Delete password?')) {
								onDelete(password._id!);
							}
						}}
					>
						<Trash2 className="w-4 h-4 text-red-500" />
					</button>
				</div>
			</div>

			{/* Username */}
			<div className="mt-3">
				<p className="text-xs text-slate-500">Username</p>
				<div className="flex justify-between bg-slate-50 p-2 rounded">
					<span className="text-sm">{password.username}</span>

					<button
						onClick={() =>
							copy(password.username, 'username')
						}
					>
						{copiedField === 'username' ? (
							<CheckCircle2 className="w-4 h-4 text-green-500" />
						) : (
							<Copy className="w-4 h-4" />
						)}
					</button>
				</div>
			</div>

			{/* Password */}
			<div className="mt-2">
				<p className="text-xs text-slate-500">Password</p>
				<div className="flex justify-between bg-slate-50 p-2 rounded">
					<span className="text-sm font-mono">
						{show ? password.password : '••••••••'}
					</span>

					<div className="flex gap-2">
						<button onClick={() => setShow(!show)}>
							{show ? (
								<EyeOff className="w-4 h-4" />
							) : (
								<Eye className="w-4 h-4" />
							)}
						</button>

						<button
							onClick={() =>
								copy(password.password, 'password')
							}
						>
							{copiedField === 'password' ? (
								<CheckCircle2 className="w-4 h-4 text-green-500" />
							) : (
								<Copy className="w-4 h-4" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Notes */}
			{password.notes && (
				<div className="mt-2">
					<p className="text-xs text-slate-500">Notes</p>
					<div className="bg-slate-50 p-2 rounded text-sm text-slate-700 whitespace-pre-wrap">
						{password.notes}
					</div>
				</div>
			)}

			{/* URL */}
			{password.url && (
				<a
					href={password.url}
					target="_blank"
					className="flex items-center justify-between mt-2 text-sm text-blue-600"
				>
					{password.url}
					<ExternalLink className="w-4 h-4" />
				</a>
			)}
		</motion.div>
	);
}
