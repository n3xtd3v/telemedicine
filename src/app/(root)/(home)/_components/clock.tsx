"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    // second: "2-digit",
  });

  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(now);

  return (
    <div className="text-center">
      <AnimatePresence mode="wait">
        <motion.h1
          key={time}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="text-4xl font-extrabold"
        >
          {time}
        </motion.h1>
      </AnimatePresence>

      <p className="text-lg font-medium text-muted-foreground">{date}</p>
    </div>
  );
}
