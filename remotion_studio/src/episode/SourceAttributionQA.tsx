import React from "react";
import { SourceAttribution } from "../components/SourceAttribution";

/** QA preview of the book-page attribution on a dark backdrop. */
export const SourceAttributionQA: React.FC = () => (
  <div style={{ position: "relative", width: 1920, height: 1080, background: "radial-gradient(ellipse at 50% 40%, #3a2716 0%, #1c120a 70%, #0d0805 100%)" }}>
    <SourceAttribution variant="intro" />
  </div>
);
