import { FaChessRook } from "react-icons/fa";
import { FaGears } from "react-icons/fa6";
import { GiGloves, GiCannon } from "react-icons/gi";

export const POSITION_MAP = {
  arq: {
    label: "ARQUERO",
    icon: GiGloves,
  },
  def: {
    label: "DEFENSOR",
    icon: FaChessRook,
  },
  med: {
    label: "MEDIOCAMPISTA",
    icon: FaGears,
  },
  del: {
    label: "DELANTERO",
    icon: GiCannon,
  },
};