"use client";

import { motion } from "framer-motion";

type LoadingScreenProps = {
  ready: boolean;
  waking: boolean;
  awakeImage: string;
  onWake: () => void;
};

export default function LoadingScreen({ ready, waking, awakeImage, onWake }: LoadingScreenProps) {
  return (
    <motion.div
      className="absolute inset-0 z-30 overflow-hidden bg-[#21160f]/92"
      initial={{ opacity: 0, scale: 0.9, filter: "blur(18px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.035, filter: "blur(12px)" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 闭眼和睁眼图始终同位叠放，因此不会出现黑屏跳转。 */}
      <button
        type="button"
        aria-label={ready ? "点击唤醒阿绒" : "阿绒正在睡觉"}
        disabled={!ready || waking}
        onClick={onWake}
        className="absolute inset-0 z-10 flex w-full items-center justify-center border-0 bg-transparent p-0 enabled:cursor-pointer disabled:cursor-default"
      >
        <motion.img
          src="/images/sleeping-cutout.png"
          alt="闭眼睡觉的阿绒"
          className="absolute h-[72%] w-[80%] select-none object-contain"
          animate={{ opacity: waking ? 0 : 1, scale: ready && !waking ? [1, 1.015, 1] : 1, y: ready && !waking ? [0, -3, 0] : 0 }}
          transition={waking ? { duration: 0.3 } : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {awakeImage ? (
          <motion.img
            src={awakeImage}
            alt="猛地睁开眼睛的阿绒"
            className="absolute h-[72%] w-[80%] select-none object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: waking ? 1 : 0, scale: waking ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        ) : (
          <motion.div
            className="absolute aspect-square w-[30%] rounded-full bg-[#ffd1dc]/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: waking ? [0, 0.7, 0] : 0, scale: waking ? [0.8, 1.1, 1] : 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </button>

      {!ready && (
        <div className="absolute bottom-[8%] left-1/2 z-20 flex w-[56%] max-w-xs -translate-x-1/2 flex-col items-center gap-3">
          <p className="text-xs tracking-[0.32em] text-[#f7ddc7]">加载中...</p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/15">
            <motion.div className="h-full origin-left rounded-full bg-[#f4a9b9]" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 3, ease: "easeInOut" }} />
          </div>
        </div>
      )}

      {ready && !waking && (
        <motion.p
          className="pointer-events-none absolute bottom-[8%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap text-xs tracking-[0.3em] text-[#f7ddc7]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          点击叫醒阿绒
        </motion.p>
      )}
    </motion.div>
  );
}
