import { jsx as _jsx } from "react/jsx-runtime";
import { clsx } from 'clsx';
export const LoadingSpinner = ({ className, size = 'md' }) => {
    return (_jsx("div", { className: clsx('inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-primary motion-reduce:animate-[spin_1.5s_linear_infinite]', size === 'sm' && 'h-4 w-4', size === 'md' && 'h-8 w-8', size === 'lg' && 'h-18 w-18', className), role: "status", children: _jsx("span", { className: "!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]", children: "Loading..." }) }));
};
