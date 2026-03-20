'use client';

import { useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CheckCircle2, AlertCircle, Clock, Zap, Star, ShieldCheck, Settings } from 'lucide-react';
import { RefreshButton } from '@/components/subscription/RefreshButton';
import { motion } from 'framer-motion';

export function BillingContent({ 
    user, 
    org 
}: { 
    user: { email: string }, 
    org: { 
        subscriptionStatus: string, 
        trialEndsAt: string, 
        planName?: string | null, 
        subscriptionPrice?: number | null, 
        subscriptionCurrency?: string | null, 
        subscriptionInterval?: string | null,
        subscriptionEndsAt?: string | null
    } 
}) {
    const isActive = org.subscriptionStatus === 'ACTIVE';
    const isTrial = org.subscriptionStatus === 'TRIAL';
    
    // Parse back ISO dates for logic
    const { trialDaysLeft, trialPercentage } = useMemo(() => {
        const trialEndsAt = new Date(org.trialEndsAt);
        // eslint-disable-next-line react-hooks/purity
        const days = Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const percentage = Math.max(0, Math.min(100, (days / 30) * 100));
        return { trialDaysLeft: days, trialPercentage: percentage };
    }, [org.trialEndsAt]);

    // Link for managing existing subscriptions
    const manageUrl = "https://crediblemark.com/id/dashboard/my-products";
    
    // Use the ID provided by the user
    const checkoutId = process.env.NEXT_PUBLIC_CREDIBLEMARK_PRODUCT_ID || 'cmmxmi4hj000004l815ky2uoj';
    const checkoutUrl = `https://crediblemark.com/id/checkout/${checkoutId}?email=${user.email}`;
    const buttonUrl = isActive ? manageUrl : checkoutUrl;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-purple-500/10 blur-[110px] rounded-full" />
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
            </div>

            <motion.div 
                className="max-w-7xl mx-auto py-12 px-4 space-y-12 relative z-10"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Header */}
                <motion.div 
                    className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                    variants={itemVariants}
                >
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
                            Billing <span className="text-indigo-600 dark:text-indigo-400">&</span> Subscription
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
                            Empower your organization with enterprise-grade protocol management and advanced workflow tools.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <RefreshButton />
                    </div>
                </motion.div>

                <div className="grid gap-8 lg:grid-cols-12 items-start">
                    {/* Status Card */}
                    <motion.div className="lg:col-span-5" variants={itemVariants}>
                        <Card className="overflow-hidden border-none shadow-2xl bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl ring-1 ring-slate-200/50 dark:ring-slate-800/50 relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
                            <CardHeader className="pb-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                        <CardTitle className="text-xl font-bold">Plan</CardTitle>
                                    </div>
                                    <Badge 
                                        variant={isActive ? "default" : "secondary"}
                                        className={`${isActive ? "bg-emerald-500 hover:bg-emerald-600" : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-none"} px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 group-hover:scale-110`}
                                    >
                                        {org.subscriptionStatus}
                                    </Badge>
                                </div>
                                <CardDescription className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                    {isActive 
                                        ? `You are currently on the ${org.planName || 'Pro Plan'}.` 
                                        : isTrial 
                                            ? `You are currently on a 30-day premium trial.` 
                                            : "Your subscription has expired. Upgrade to continue using premium features."
                                    }
                                    {isActive && org.subscriptionPrice && (
                                        <div className="mt-2 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: org.subscriptionCurrency || 'USD' }).format(org.subscriptionPrice)}
                                            <span className="text-sm font-medium text-slate-400"> / {org.subscriptionInterval || 'month'}</span>
                                        </div>
                                    )}
                                    {isActive && org.subscriptionEndsAt && (
                                        <div className="mt-1 text-xs text-slate-400">
                                            Next payment: {new Date(org.subscriptionEndsAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8 relative z-10">
                                {isTrial && (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                            <span className="flex items-center gap-1.5 uppercase tracking-tighter">
                                                <Clock className="w-3.5 h-3.5" />
                                                Trial Progress
                                            </span>
                                            <span className="text-indigo-600 dark:text-indigo-400">{trialDaysLeft} days left</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-[1px]">
                                            <motion.div 
                                                className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.5)]"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${trialPercentage}%` }}
                                                transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button 
                                    asChild 
                                    className="w-full h-14 text-base font-bold shadow-xl shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
                                >
                                    <a href={buttonUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                                        {isActive ? (
                                            <>
                                                <Settings className="w-5 h-5" />
                                                Manage Subscription
                                            </>
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5 fill-white" />
                                                Upgrade to Pro
                                            </>
                                        )}
                                    </a>
                                </Button>
                                
                                <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-medium">
                                    Trusted payments processed securely via <span className="text-slate-600 dark:text-slate-300 font-bold">Crediblemark</span>.
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Features Card */}
                    <motion.div className="lg:col-span-7" variants={itemVariants}>
                        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden relative min-h-[400px]">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.05] dark:opacity-[0.1]">
                                <Star className="w-32 h-32 text-indigo-600" />
                            </div>
                            <CardHeader className="relative z-10 text-slate-950 dark:text-slate-50">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                    <CardTitle className="text-xl font-bold">Pro Plan Benefits</CardTitle>
                                </div>
                                <CardDescription className="text-slate-500 dark:text-slate-400 mt-2">
                                    Everything you need for industrial-scale protocol management.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <ul className="grid sm:grid-cols-2 gap-4">
                                    {[
                                        "Unlimited Projects & SOP Protocols",
                                        "Advanced Real-time Analytics",
                                        "Multi-agent AI Collaboration",
                                        "Custom Metadata & Custom Forms",
                                        "Audit Logs & Workflow History",
                                        "Priority Developer Support"
                                    ].map((benefit, i) => (
                                        <motion.li 
                                            key={i}
                                            className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/10 group"
                                            whileHover={{ x: 5 }}
                                        >
                                            <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                {benefit}
                                            </span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
                
                {/* FAQ/Help */}
                <motion.div 
                    className="flex flex-col md:flex-row items-center justify-between p-8 rounded-2xl bg-indigo-600/5 dark:bg-indigo-400/5 border border-indigo-100 dark:border-indigo-900/30 gap-6"
                    variants={itemVariants}
                >
                    <div className="flex items-center gap-4 text-center md:text-left">
                        <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                            <AlertCircle className="w-6 h-6 border-none" />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">Need help with your plan?</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Our team is available to assist you with any billing or enterprise inquiries.</p>
                        </div>
                    </div>
                    <Button variant="outline" className="rounded-full px-8 font-bold border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300">
                        Contact Sales
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
