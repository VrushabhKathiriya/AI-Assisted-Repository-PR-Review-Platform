import { forwardRef } from "react";

const Input = forwardRef(
  (
    {
      label,
      error,
      id,
      type = "text",
      placeholder,
      className = "",
      disabled = false,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-gray-300"
          >
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-[#0d1117] border rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            ${error ? "border-red-500" : "border-[#30363d] hover:border-[#6e7681]"}
            ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-400 mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
