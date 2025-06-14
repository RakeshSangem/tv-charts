import { Search } from "lucide-react";
import { forwardRef } from "react";

const SearchInput = forwardRef(function SearchInput(
  { value, onChange, placeholder = "Search...", className = "", ...rest },
  ref
) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        ref={ref}
        className={`block w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...rest}
      />
    </div>
  );
});

export default SearchInput;
