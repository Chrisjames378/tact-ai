sed -i '1464,1466c\
        </button>\
        <button\
          onClick={() => setActiveTool("invoice")}\
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${\
            activeTool === "invoice"\
              ? "bg-zinc-900 text-blue-400 shadow-inner"\
              : "text-zinc-400 hover:text-zinc-200"\
          }`}\
        >\
          <Download className="w-3.5 h-3.5 text-purple-400" />\
          <span>Log/Invoice</span>\
        </button>\
        <button\
          onClick={() => setActiveTool("thermal_map")}\
          className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 font-mono text-xs font-medium transition-all rounded-md cursor-pointer ${\
            activeTool === "thermal_map"' src/components/RepairToolbox.tsx
