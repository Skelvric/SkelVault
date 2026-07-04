'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Plus, LogOut, User, Menu, X, Key, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { apiFetch } from '@/lib/apiFetch';

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
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [isMobile, setIsMobile] = useState<boolean | null>(null);
	const [user, setUser] = useState<UserProfile | null>(null);
	const [showUserMenu, setShowUserMenu] = useState(false);

	useEffect(() => {
		fetchUser();
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

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
			await apiFetch('/api/auth/logout', { method: 'POST' });
			toast.success('Signed out');
			router.push('/');
			router.refresh();
		} catch (error) {
			toast.error('Logout failed. Please try again.');
		}
	};

	const menuItems = [
		{ icon: Lock, label: 'Dashboard', href: '/dashboard' },
		{ icon: Key, label: 'Passwords', href: '/passwords' },
	];

	const sidebarContent = (
		<div className="flex flex-col h-full bg-card">
			{/* Logo */}
			<div className="h-16 flex items-center px-5 border-b border-border shrink-0">
				<Link href="/dashboard" className="flex items-center gap-2.5">
					<div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
						<Lock className="w-4 h-4 text-primary-foreground" />
					</div>
					<div>
						<p className="font-semibold text-sm leading-tight">SkelVault</p>
						<p className="text-[11px] text-muted-foreground leading-tight">Password Manager</p>
					</div>
				</Link>
			</div>

			{/* Menu */}
			<nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
				{menuItems.map((item) => {
					const isActive = pathname === item.href;
					return (
						<Link
							key={item.href}
							href={item.href}
							onClick={() => isMobile && setIsOpen(false)}
							className={cn(
								'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
								isActive
									? 'bg-accent text-accent-foreground'
									: 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
							)}
						>
							<item.icon className="w-4 h-4 shrink-0" />
							{item.label}
						</Link>
					);
				})}

				<button
					onClick={() => {
						onAddPassword?.();
						isMobile && setIsOpen(false);
					}}
					className="w-full flex items-center gap-3 px-3 py-2 mt-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
				>
					<Plus className="w-4 h-4 shrink-0" />
					Add password
				</button>
			</nav>

			{/* User */}
			<div className="border-t border-border p-3 shrink-0 relative">
				<div className="flex items-center gap-2 mb-2 px-1">
					<span className="text-[11px] text-muted-foreground">Appearance</span>
					<ThemeToggle className="ml-auto h-7 w-7" />
				</div>

				<button
					onClick={() => setShowUserMenu((v) => !v)}
					className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/60 transition-colors"
				>
					<div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
						{user?.avatar ? (
							<img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
						) : (
							<User className="w-4 h-4 text-muted-foreground" />
						)}
					</div>
					<div className="flex-1 text-left min-w-0">
						<p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
						<p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
					</div>
					<ChevronDown
						className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', showUserMenu && 'rotate-180')}
					/>
				</button>

				<AnimatePresence>
					{showUserMenu && (
						<>
							<div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
							<motion.div
								initial={{ opacity: 0, y: 6, scale: 0.97 }}
								animate={{ opacity: 1, y: 0, scale: 1 }}
								exit={{ opacity: 0, y: 6, scale: 0.97 }}
								transition={{ duration: 0.15 }}
								className="absolute bottom-[4.25rem] left-3 right-3 z-50 bg-popover border border-border rounded-xl shadow-lg overflow-hidden"
							>
								<Link
									href="/profile"
									onClick={() => setShowUserMenu(false)}
									className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors"
								>
									<User className="w-4 h-4 text-muted-foreground" />
									Profile settings
								</Link>
								<div className="h-px bg-border" />
								<button
									onClick={() => {
										handleLogout();
										setShowUserMenu(false);
									}}
									className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
								>
									<LogOut className="w-4 h-4" />
									Sign out
								</button>
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</div>
		</div>
	);

	if (isMobile === null) {
		// Not yet determined on first client render — render nothing rather
		// than guessing, to avoid a flash of the wrong layout (desktop
		// sidebar briefly showing on mobile, or vice versa) before the real
		// viewport width is known.
		return null;
	}

	if (isMobile) {
		return (
			<>
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="fixed z-50 p-3 -m-0.5 bg-card border border-border rounded-lg shadow-sm md:hidden active:bg-accent transition-colors"
					style={{
						top: 'max(0.75rem, env(safe-area-inset-top))',
						left: 'max(0.75rem, env(safe-area-inset-left))',
					}}
					aria-label={isOpen ? 'Close menu' : 'Open menu'}
				>
					{isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
				</button>

				<AnimatePresence>
					{isOpen && (
						<>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								onClick={() => setIsOpen(false)}
								className="fixed inset-0 bg-black/50 z-30"
							/>
							<motion.div
								initial={{ x: '-100%' }}
								animate={{ x: 0 }}
								exit={{ x: '-100%' }}
								transition={{ type: 'spring', stiffness: 320, damping: 32 }}
								className="fixed left-0 top-0 h-[100dvh] w-72 max-w-[85vw] z-40 border-r border-border shadow-2xl"
							>
								{sidebarContent}
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</>
		);
	}

	return (
		<div className="fixed left-0 top-0 h-[100dvh] w-64 z-30 border-r border-border hidden md:block">
			{sidebarContent}
		</div>
	);
}
