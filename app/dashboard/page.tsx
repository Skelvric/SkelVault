'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../../components/ui/SideBar';
import { Password } from '../../lib/types';

export default function DashboardPage() {
	const [passwords, setPasswords] = useState<Password[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchPasswords();
	}, []);

	const fetchPasswords = async () => {
		setLoading(true);
		try {
			const res = await fetch('/api/passwords');
			const data = await res.json();
			setPasswords(data || []);
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

			if (
				p.password.length < 10 ||
				/password|123|qwerty/i.test(p.password)
			) {
				weak++;
			}
		});

		const recent = [...passwords]
			.sort(
				(a, b) =>
					new Date(b.createdAt || 0).getTime() -
					new Date(a.createdAt || 0).getTime()
			)
			.slice(0, 5);

		const score = Math.max(0, 100 - weak * 10);

		return { total, categoryMap, weak, recent, score };
	}, [passwords]);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-slate-50">
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
			<Sidebar onAddPassword={() => { }} />

			<main className="flex-1 p-8 md:p-12 ml-0 md:ml-64 space-y-10">

				{/* Header */}
				<header className="space-y-2">
					<h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
						Security Overview
					</h1>
					<p className="text-slate-500 text-base">
						Insights about your password vault.
					</p>
				</header>

				{/* Top Cards */}
				<section className="grid grid-cols-1 md:grid-cols-3 gap-6">

					<Card>
						<p className="text-slate-500 text-sm">Total Passwords</p>
						<p className="text-3xl font-semibold mt-2">
							{stats.total}
						</p>
					</Card>

					<Card>
						<p className="text-slate-500 text-sm">Weak Passwords</p>
						<p className="text-3xl font-semibold mt-2 text-red-500">
							{stats.weak}
						</p>
					</Card>

					<Card>
						<p className="text-slate-500 text-sm">Security Score</p>
						<p
							className={`text-3xl font-semibold mt-2 ${stats.score > 70
									? 'text-green-600'
									: 'text-orange-500'
								}`}
						>
							{stats.score}/100
						</p>
					</Card>

				</section>

				{/* Middle Grid */}
				<section className="grid md:grid-cols-2 gap-6">

					{/* Category */}
					<Card>
						<h2 className="text-lg font-medium mb-6">
							Categories
						</h2>

						<div className="space-y-5">
							{Object.entries(stats.categoryMap).map(
								([key, value]) => (
									<div key={key} className="space-y-2">
										<div className="flex justify-between text-sm">
											<span>{key}</span>
											<span className="text-slate-500">
												{value}
											</span>
										</div>

										<div className="h-2 bg-slate-100 rounded-full overflow-hidden">
											<div
												className="h-full bg-slate-900 rounded-full transition-all"
												style={{
													width: `${(value /
															stats.total) *
														100
														}%`,
												}}
											/>
										</div>
									</div>
								)
							)}
						</div>
					</Card>

					{/* Recent */}
					<Card>
						<h2 className="text-lg font-medium mb-6">
							Recently Added
						</h2>

						<div className="space-y-4">
							{stats.recent.slice(0, 4).map((p) => (
								<div
									key={p._id}
									className="flex items-center justify-between"
								>
									<div>
										<p className="text-sm font-medium">
											{p.title}
										</p>
										<p className="text-xs text-slate-500">
											{p.username}
										</p>
									</div>

									<span className="text-xs text-slate-400">
										{p.category || 'Other'}
									</span>
								</div>
							))}
						</div>
					</Card>

				</section>

				{/* FOOTER INSIGHT */}
				<section>
					<Card className="flex items-center justify-between">
						<div>
							<p className="text-sm text-slate-500">
								Vault Health
							</p>
							<p className="text-xl font-medium">
								Everything looks{' '}
								<span className="text-green-600">
									{stats.score > 70 ? 'good' : 'needs attention'}
								</span>
							</p>
						</div>

						<div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
							<div
								className={`h-full rounded-full ${stats.score > 70
										? 'bg-green-500'
										: 'bg-orange-500'
									}`}
								style={{ width: `${stats.score}%` }}
							/>
						</div>
					</Card>
				</section>

			</main>
		</div>
	);
}

/* Modern Card */
function Card({
	children,
	className = '',
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition ${className}`}
		>
			{children}
		</div>
	);
}
