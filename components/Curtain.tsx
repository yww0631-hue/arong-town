"use client";

import { motion } from "framer-motion";

type CurtainProps = {
  /** 电视被点击后，将窗帘压低到背景层，避免抢画面中心。 */
  subdued?: boolean;
};

export default function Curtain({ subdued = false }: CurtainProps) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
      animate={{ opacity: subdued ? 0.16 : 0.42 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* 左右各放一片；宽度被限制在边缘，绝不覆盖电视中心区域。 */}
      <div className="curtain-sway absolute -left-[4vw] top-0 h-full w-[18vw] min-w-24 origin-top-left rounded-r-[55%] bg-gradient-to-r from-[#3b1718]/80 via-[#75343a]/50 to-transparent shadow-[20px_0_45px_rgba(30,8,8,.4)]" />
      <div className="curtain-sway curtain-sway-right absolute -right-[4vw] top-0 h-full w-[18vw] min-w-24 origin-top-right rounded-l-[55%] bg-gradient-to-l from-[#3b1718]/80 via-[#75343a]/50 to-transparent shadow-[-20px_0_45px_rgba(30,8,8,.4)]" />
    </motion.div>
  );
}
