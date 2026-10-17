import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CHAPTERS } from "../data/story";
import { GoldButton } from "./bits";
import Ch01 from "../interactions/Ch01";
import Ch02 from "../interactions/Ch02";
import Ch03 from "../interactions/Ch03";
import Ch04 from "../interactions/Ch04";
import Ch05 from "../interactions/Ch05";
import Ch06 from "../interactions/Ch06";
import Ch07 from "../interactions/Ch07";
import Ch08 from "../interactions/Ch08";
import Ch09 from "../interactions/Ch09";
import Ch10 from "../interactions/Ch10";
import Ch11 from "../interactions/Ch11";
import Ch12 from "../interactions/Ch12";

const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

export default function Book() {
  // -1 = cover
  const [page, setPage] = useState(-1);

  const go = useCallback(
    (p: number) => setPage(Math.max(-1, Math.min(CHAPTERS.length - 1, p))),
    []
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(page + 1);
      if (e.key === "ArrowLeft") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, go]);

  const chapter = page >= 0 ? CHAPTERS[page] : null;

  const stage = (() => {
    switch (page) {
      case 0: return <Ch01 />;
      case 1: return <Ch02 />;
      case 2: return <Ch03 />;
      case 3: return <Ch04 />;
      case 4: return <Ch05 />;
      case 5: return <Ch06 />;
      case 6: return <Ch07 />;
      case 7: return <Ch08 />;
      case 8: return <Ch09 />;
      case 9: return <Ch10 />;
      case 10: return <Ch11 />;
      case 11: return <Ch12 onRestart={() => go(-1)} />;
      default: return null;
    }
  })();

  return (
    <div className="grain relative flex h-dvh flex-col overflow-hidden bg-paper">
      <AnimatePresence mode="wait">
        {page === -1 ? (
          /* ---------------- cover ---------------- */
          <motion.div
            key="cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex-1"
          >
            <img
              src="images/cover.jpg"
              alt="绘本封面：漂流的终点，能量的序章"
              className="kenburns absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-marine/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-4 px-6 pb-10 text-center md:pb-14">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-col items-center gap-3 bg-marine/55 px-8 py-6 shadow-2xl backdrop-blur-[3px]"
              >
                <span className="mini-title text-gold">交互绘本 · 一块锂电池的漂流与重生</span>
                <h1 className="font-display text-4xl tracking-[0.1em] text-[#f4ecd8] drop-shadow-md md:text-6xl">
                  终点是新的起点
                </h1>
                <div className="mt-2 flex items-center gap-4">
                  <img src="images/battery.png" alt="小电池" className="floaty w-16 drop-shadow-lg md:w-20" />
                  <GoldButton onClick={() => go(0)} className="text-base">
                    翻开绘本
                  </GoldButton>
                </div>
                <p className="mt-1 text-xs tracking-[0.25em] text-[#f4ecd8]/70">共十二章 · 每章藏着一个可以触摸的小机关</p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* ---------------- chapter ---------------- */
          <motion.div
            key={`chapter-${page}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {/* top bar */}
            <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#e0d6bd] bg-paperdeep/80 px-4 backdrop-blur-sm md:px-6">
              <button
                type="button"
                onClick={() => go(-1)}
                className="mini-title cursor-pointer transition-opacity hover:opacity-70"
                aria-label="回到封面"
              >
                终点是新的起点
              </button>
              <nav className="hidden items-center gap-1.5 md:flex" aria-label="章节导航">
                {CHAPTERS.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`第${CN_NUM[i]}章 ${c.title}`}
                    aria-current={i === page ? "page" : undefined}
                    className="h-2.5 cursor-pointer rounded-full transition-all duration-200"
                    style={{
                      width: i === page ? 22 : 10,
                      background: i === page ? "var(--gold-deep)" : i < page ? "var(--teal)" : "#cfc4a4",
                    }}
                  />
                ))}
              </nav>
              <span className="text-xs tracking-[0.2em] text-inksoft md:hidden">
                {page + 1} / {CHAPTERS.length}
              </span>
              <span className="hidden text-xs tracking-[0.25em] text-inksoft md:block">
                第{CN_NUM[page]}章 · 共十二章
              </span>
            </header>

            {/* stage */}
            <main className="relative min-h-0 flex-1">{stage}</main>

            {/* narration strip */}
            <footer className="relative z-30 shrink-0 bg-marine">
              <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-6 md:px-6">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-display text-lg text-gold">{chapter!.title}</h2>
                    <span className="text-[11px] tracking-[0.25em] text-[#f4ecd8]/60">{chapter!.subtitle}</span>
                  </div>
                  <p className="font-narr mt-1 text-sm leading-relaxed text-[#f4ecd8]/95 md:text-[15px]">
                    {chapter!.narration}
                  </p>
                  <p className="mt-1 text-[11px] tracking-[0.15em] text-[#8fd0da]">✦ {chapter!.hint}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <GoldButton variant="outline" onClick={() => go(page - 1)} disabled={page <= 0}>
                    上一章
                  </GoldButton>
                  <GoldButton onClick={() => go(page + 1)} disabled={page >= CHAPTERS.length - 1}>
                    下一章
                  </GoldButton>
                </div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
