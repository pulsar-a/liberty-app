import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faCheck } from '@fortawesome/free-solid-svg-icons';
import { clsx } from 'clsx';
export const Select = ({ label, options = [], value, onChange, disabled, }) => {
    const [selected, setSelected] = useState(options.find((item) => item.value === value) || options[0] || {});
    const handleChange = (item) => {
        setSelected(item);
        onChange?.(item.value);
    };
    return (_jsx(Listbox, { value: selected, onChange: handleChange, disabled: disabled, children: ({ open }) => (_jsxs(_Fragment, { children: [label && (_jsx(Listbox.Label, { className: "block text-sm font-medium leading-6 text-gray-900 dark:text-white", children: label })), _jsxs("div", { className: "relative mt-2", children: [_jsxs(Listbox.Button, { className: "relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6", children: [_jsx("span", { className: "flex items-center", children: _jsx("span", { className: "ml-3 block truncate", children: selected.label }) }), _jsx("span", { className: "pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2", children: _jsx(FontAwesomeIcon, { icon: faChevronDown, className: "h-5 w-5 text-gray-400", "aria-hidden": "true" }) })] }), _jsx(Transition, { show: open, as: Fragment, leave: "transition ease-in duration-100", leaveFrom: "opacity-100", leaveTo: "opacity-0", children: _jsx(Listbox.Options, { className: "absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm", children: options.map((option) => (_jsx(Listbox.Option, { className: ({ active }) => clsx(active ? 'bg-indigo-600 text-white' : 'text-gray-900', 'relative cursor-default select-none py-2 pl-3 pr-9'), value: option, disabled: option.disabled, children: ({ selected, active }) => (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex items-center", children: _jsx("span", { className: clsx(selected ? 'font-semibold' : 'font-normal', 'ml-3 block truncate'), children: option.label }) }), selected ? (_jsx("span", { className: clsx(active ? 'text-white' : 'text-indigo-600', 'absolute inset-y-0 right-0 flex items-center pr-4'), children: _jsx(FontAwesomeIcon, { icon: faCheck, className: "h-5 w-5", "aria-hidden": "true" }) })) : null] })) }, option.label))) }) })] })] })) }));
};
