'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, LogOut, User, Menu, X, Key, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserProfile {
	_id: string;
	name: string;
	email: string;
	avatar?: string;
}

interface SidebarProps {
	onAddPassword?: () => void;
}

export default function Sidebar({ onAddPassword }: SidebarProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(true);
	const [isMobile, setIsMobile] = useState(false);
	const [user, setUser] = useState<UserProfile | null>(null);
	const [showUserMenu, setShowUserMenu] = useState(false);

	useEffect(() => {
		fetchUser();
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleResize = () => {
		setIsMobile(window.innerWidth < 768);
		if (window.innerWidth < 768) {
			setIsOpen(false);
		}
	};

	const fetchUser = async () => {
		try {
			const res = await fetch('/api/profile');
			if (res.ok) {
				const data = await res.json();
				setUser(data);
			}
		} catch (error) {
			console.error('Failed to fetch user:', error);
		}
	};

	const handleLogout = async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' });
			router.push('/');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	};

	const menuItems = [
		{
			icon: <Lock className="w-5 h-5" />,
			label: 'Dashboard',
			href: '/dashboard',
		},
		{
			icon: <Key className="w-5 h-5" />,
			label: 'Passwords',
			href: '/passwords',
		}
	];

	return (
		<>
			{/* Mobile Toggle */}
			<motion.button
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				onClick={() => setIsOpen(!isOpen)}
				className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg md:hidden"
			>
				{isOpen ? (
					<X className="w-6 h-6 text-slate-900" />
				) : (
					<Menu className="w-6 h-6 text-slate-900" />
				)}
			</motion.button>

			{/* Sidebar */}
			<AnimatePresence>
				{(isOpen || !isMobile) && (
					<>
						{/* Mobile Overlay */}
						{isMobile && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => setIsOpen(false)}
								className="fixed inset-0 bg-black/50 z-30 md:hidden"
							/>
						)}

						{/* Sidebar Content */}
						<motion.div
							initial={{ x: -250 }}
							animate={{ x: 0 }}
							exit={{ x: -250 }}
							transition={{ type: 'spring', stiffness: 300, damping: 30 }}
							className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl z-40 flex flex-col"
						>
							{/* Logo */}
							<div className="p-6 border-b border-slate-700">
								<Link href="/dashboard" className="flex items-center gap-3">
									<motion.div
										whileHover={{ scale: 1.1 }}
										className="w-10 h-10 bg-white rounded-lg flex items-center justify-center"
									>
										<Lock className="w-6 h-6 text-slate-900" />
									</motion.div>
									<div>
										<h2 className="text-white font-bold text-lg">SkelVault</h2>
										<p className="text-xs text-slate-400">Password Manager</p>
									</div>
								</Link>
							</div>

							{/* Menu Items */}
							<nav className="flex-1 px-4 py-6 space-y-2">
								{menuItems.map((item, index) => (
									<motion.div
										key={index}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.1 }}
									>
										<Link
											href={item.href}
											onClick={() => isMobile && setIsOpen(false)}
											className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all group"
										>
											<div className="group-hover:text-white transition-colors">
												{item.icon}
											</div>
											<span className="font-medium">{item.label}</span>
										</Link>
									</motion.div>
								))}

								{/* Add Password Button */}
								<motion.button
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.2 }}
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={() => {
										onAddPassword?.();
										isMobile && setIsOpen(false);
									}}
									className="w-full flex items-center gap-3 px-4 py-3
           bg-gradient-to-r from-white to-slate-100
           text-slate-900 rounded-xl
           hover:from-slate-100 hover:to-slate-200
           transition-all font-semibold
           shadow-md mt-4"
								>
									<Plus className="w-5 h-5" />
									<span>Add Password</span>
								</motion.button>
							</nav>

							{/* User Profile Card */}
							<div className="border-t border-slate-700">
								<motion.div
									whileHover={{ scale: 1.02 }}
									onClick={() => setShowUserMenu(!showUserMenu)}
									className="relative"
								>
									<button className="w-full flex items-center gap-3 p-3 hover:bg-white/10 rounded-lg transition-colors cursor-pointer group">
										{/* Avatar */}
										<div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
											{user?.avatar ? (
												<img
													src={user.avatar}
													alt={user.name}
													className="w-full h-full object-cover"
												/>
											) : (
												<User className="w-6 h-6 text-slate-900" />
											)}
										</div>

										{/* User Info */}
										<div className="flex-1 text-left">
											<p className="text-sm font-semibold text-white truncate">
												{user?.name || 'User'}
											</p>
											<p className="text-xs text-slate-400 truncate">
												{user?.email || 'user@example.com'}
											</p>
										</div>

										{/* Chevron */}
										<motion.div
											animate={{ rotate: showUserMenu ? 180 : 0 }}
											className="text-slate-400"
										>
											▼
										</motion.div>
									</button>

									{/* User Menu Dropdown */}
									<AnimatePresence>
										{showUserMenu && (
											<>
												{/* Backdrop (çok hafif blur hissi) */}
												<motion.div
													initial={{ opacity: 0 }}
													animate={{ opacity: 1 }}
													exit={{ opacity: 0 }}
													onClick={() => setShowUserMenu(false)}
													className="fixed inset-0 z-40"
												/>

												{/* Dropdown container */}
												<motion.div
													initial={{ opacity: 0, y: 8, scale: 0.97 }}
													animate={{ opacity: 1, y: 0, scale: 1 }}
													exit={{ opacity: 0, y: 8, scale: 0.97 }}
													transition={{ duration: 0.15 }}
													className="absolute bottom-16 left-3 right-3 z-50
                   bg-slate-900/95 backdrop-blur-xl
                   border border-slate-700
                   rounded-2xl shadow-2xl overflow-hidden"
												>
													{/* Profile item */}
													<Link
														href="/profile"
														onClick={() => setShowUserMenu(false)}
														className="flex items-center gap-3 px-4 py-3
                     text-slate-200 hover:bg-slate-800/70
                     transition-all"
													>
														<div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
															<User className="w-4 h-4 text-slate-300" />
														</div>

														<div className="flex flex-col leading-tight">
															<span className="text-sm font-medium">Profile</span>
															<span className="text-[11px] text-slate-400">
																Edit your account settings
															</span>
														</div>
													</Link>

													{/* Divider */}
													<div className="h-px bg-slate-800" />

													{/* Logout */}
													<button
														onClick={() => {
															handleLogout();
															setShowUserMenu(false);
														}}
														className="w-full flex items-center gap-3 px-4 py-3
                     text-red-400 hover:bg-red-500/10
                     transition-all"
													>
														<div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
															<LogOut className="w-4 h-4" />
														</div>

														<div className="flex flex-col leading-tight">
															<span className="text-sm font-medium">Logout</span>
															<span className="text-[11px] text-red-300/60">
																Sign out of your account
															</span>
														</div>
													</button>
												</motion.div>
											</>
										)}
									</AnimatePresence>
								</motion.div>
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}
