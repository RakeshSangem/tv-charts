import { useState, useMemo, useEffect, useRef } from "react";
import { BarChart3, X } from "lucide-react";
import Modal from "./Modal";
import SearchInput from "./SearchInput";

const INDICATORS = {
  mainChart: [
    {
      id: "sma",
      name: "Simple Moving Average",
      type: "mainChart",
      defaultPeriod: 20,
    },
    {
      id: "ema",
      name: "Exponential Moving Average",
      type: "mainChart",
      defaultPeriod: 20,
    },
    {
      id: "bollinger",
      name: "Bollinger Bands",
      type: "mainChart",
      defaultPeriod: 20,
    },
    { id: "vwap", name: "Volume Weighted Average Price", type: "mainChart" },
  ],
  separatePane: [
    { id: "macd", name: "MACD", type: "separatePane" },
    {
      id: "rsi",
      name: "Relative Strength Index",
      type: "separatePane",
      defaultPeriod: 14,
    },
    { id: "volume", name: "Volume", type: "separatePane" },
    { id: "stochastic", name: "Stochastic Oscillator", type: "separatePane" },
  ],
};

const IndicatorsModal = ({ isOpen, onClose, onSelectIndicator }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const closeButtonRef = useRef(null);
  const optionRefs = useRef([]);

  const allIndicators = useMemo(
    () => [...INDICATORS.mainChart, ...INDICATORS.separatePane],
    []
  );

  const filteredIndicators = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allIndicators.filter((indicator) =>
      indicator.name.toLowerCase().includes(query)
    );
  }, [searchQuery, allIndicators]);

  // Focus search on open and reset highlight
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
      const t = setTimeout(() => searchInputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setHighlightedIndex(-1);
      optionRefs.current = [];
    }
  }, [isOpen]);

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(-1);
    optionRefs.current = [];
  }, [searchQuery]);

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    const len = filteredIndicators.length;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (len === 0) return;
        if (document.activeElement === searchInputRef.current) {
          setHighlightedIndex(0);
          optionRefs.current[0]?.focus();
        } else {
          const next = highlightedIndex < len - 1 ? highlightedIndex + 1 : 0;
          setHighlightedIndex(next);
          optionRefs.current[next]?.focus();
        }
        break;
      case "ArrowUp": {
        e.preventDefault();
        if (len === 0) return;
        const prev = highlightedIndex > 0 ? highlightedIndex - 1 : len - 1;
        setHighlightedIndex(prev);
        optionRefs.current[prev]?.focus();
        break;
      }
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(filteredIndicators[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredIndicators, highlightedIndex]);

  const handleSelect = (indicator) => {
    onSelectIndicator(indicator);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="indicators-modal-title"
      aria-describedby="indicators-modal-description"
    >
      <div
        className="flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2
            id="indicators-modal-title"
            className="text-lg text-slate-100 flex items-center gap-x-1"
          >
            <BarChart3 className="h-5 w-5 text-indigo-400 mr-2" />
            Technical Indicators
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="rounded-md text-slate-400 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={onClose}
            aria-label="Close indicators modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 border-b border-slate-700">
          <SearchInput
            ref={searchInputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search indicators..."
            aria-label="Search indicators"
            aria-controls="indicators-list"
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Indicator List */}
        <div className="overflow-y-auto pt-2 pb-4">
          {filteredIndicators.length > 0 ? (
            <>
              <h4
                id="indicators-category-label"
                className="px-4 mx-1 mb-2 text-[11px] text-[#787b86] font-normal tracking-[0.4px] leading-[16px] uppercase whitespace-nowrap"
              >
                Script name
              </h4>

              <div
                id="indicators-list"
                role="listbox"
                aria-labelledby="indicators-category-label"
                aria-activedescendant={
                  highlightedIndex >= 0
                    ? `indicator-option-${filteredIndicators[highlightedIndex].id}`
                    : undefined
                }
                className="space-y-0.5 outline-none px-1"
              >
                {filteredIndicators.map((indicator, index) => (
                  <button
                    key={indicator.id}
                    ref={(el) => (optionRefs.current[index] = el)}
                    id={`indicator-option-${indicator.id}`}
                    role="option"
                    aria-selected={highlightedIndex === index}
                    onClick={() => handleSelect(indicator)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full text-left px-4 py-2 font-light text-sm text-slate-200 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md ${
                      highlightedIndex === index ? "bg-slate-700/50" : ""
                    }`}
                    tabIndex={-1}
                  >
                    {indicator.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div
              className="text-center py-4 text-slate-400"
              role="status"
              aria-live="polite"
            >
              No indicators found
            </div>
          )}
        </div>

        {/* Keyboard instructions */}
        <div className="px-4 py-2 border-t border-slate-700 text-xs text-slate-400">
          <p>
            Use <kbd className="px-1 py-0.5 bg-slate-700 rounded">↑</kbd>{" "}
            <kbd className="px-1 py-0.5 bg-slate-700 rounded">↓</kbd> to
            navigate,{" "}
            <kbd className="px-1 py-0.5 bg-slate-700 rounded">Enter</kbd> to
            select
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default IndicatorsModal;
