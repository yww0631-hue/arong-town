"use client";

import { AnimatePresence, motion } from "framer-motion";

type FittingRoomProps = {
  background: string;
  outfitCards: [string, string, string, string];
  outfits: [string, string, string, string];
  currentOutfit: number;
  changing: boolean;
  onSelect: (index: number) => void;
};

const outfitNames = ["#01 秋日套装", "#02 糕点师", "#03 家居日常", "#04 冬日套装"];

export default function FittingRoom({ background, outfitCards, outfits, currentOutfit, changing, onSelect }: FittingRoomProps) {
  return (
    <motion.section className="absolute inset-0 overflow-hidden bg-gradient-to-br from-[#5e3028] via-[#9b6254] to-[#d7a48e]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {background && <img src={background} alt="针线盒内部试衣间" className="absolute inset-0 h-full w-full object-cover" />}
      <div className="absolute inset-0 bg-black/10" />

      {/* 角色占据上方独立展示区，不再伸进底部服装卡片区域。 */}
      <div className="absolute inset-x-[25%] bottom-[37%] top-[4%] flex items-end justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentOutfit}
            className="flex h-full w-full items-end justify-center"
            initial={{ y: currentOutfit === 0 ? -300 : 0, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1, scaleY: [1, 0.8, 1.1, 1] }}
            exit={{ opacity: 0, scale: 0.92, filter: "blur(5px)" }}
            transition={{ y: { type: "spring", stiffness: 150, damping: 12 }, opacity: { duration: 0.25 }, scale: { type: "spring", stiffness: 150, damping: 12 }, scaleY: { duration: 0.55, ease: "easeOut" } }}
          >
            {outfits[currentOutfit] ? (
              <img src={outfits[currentOutfit]} alt={`阿绒穿着${outfitNames[currentOutfit].slice(4)}`} className="h-full w-full object-contain object-bottom" />
            ) : (
              <div className="mb-3 flex aspect-[3/4] h-[78%] items-center justify-center rounded-[40%] bg-[#f3a6b8]/80 text-center text-xs text-white/90">将 outfit{currentOutfit + 1} 立绘拖入变量</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {changing && (
          <motion.div key="magic-flash" className="pointer-events-none absolute inset-0 z-20 bg-white" initial={{ opacity: 0, scale: 1 }} animate={{ opacity: [0, 0.82, 0], scale: [1, 1.02, 1] }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: "easeInOut" }} />
        )}
      </AnimatePresence>

      {/*
       * 卡片固定在角色下方；右侧继续预留遥控器安全区。
       * 明确限制高度，保证 2×2 卡片不会向上盖住角色身体。
       */}
      <div className="absolute bottom-[3%] left-[4%] right-[24%] top-[68%] z-30 grid grid-cols-2 gap-1.5">
        {outfitNames.map((name, index) => {
          const selected = currentOutfit === index;
          return (
            <motion.button
              key={name}
              type="button"
              disabled={changing}
              onClick={() => onSelect(index)}
              className={`relative min-h-0 overflow-hidden rounded-lg border bg-[#211a19]/85 p-1 text-[8px] text-white backdrop-blur-sm sm:text-[10px] ${selected ? "border-[#ff9db5] shadow-[0_0_18px_rgba(255,120,160,.9)]" : "border-white/20"}`}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              {outfitCards[index] && <img src={outfitCards[index]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />}
              <span className="relative z-10 rounded bg-black/35 px-1 py-0.5 font-semibold">{name}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.section>
  );
}
