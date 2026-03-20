import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
    children: React.ReactNode;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 16,
        scale: 0.99,
    },
    enter: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.35,
            ease: [0.25, 0.1, 0.25, 1], // cubic-bezier suave
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.99,
        transition: {
            duration: 0.2,
            ease: [0.4, 0, 1, 1],
        },
    },
};

export const PageTransition = ({ children }: PageTransitionProps) => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                variants={pageVariants as any}
                initial="initial"
                animate="enter"
                exit="exit"
                style={{ width: '100%' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};
