import type { EventDayTile } from "../../model";

import styles from "./event-day-tiles.module.css";

type EventDayTilesProps = Readonly<{
  tiles: readonly EventDayTile[];
  /** Blocos menores do celular e do tablet (`Dashboard Mobile`). */
  isCompact?: boolean;
}>;

/** Os dias do evento em blocos, como "Sex" sobre "23", no resumo sobre o navy. */
export function EventDayTiles({ tiles, isCompact = false }: EventDayTilesProps) {
  return (
    <ul className={styles.tiles} data-compact={isCompact || undefined} aria-label="Dias do evento">
      {tiles.map((tile) => (
        <li key={tile.id} className={styles.tile}>
          <span className={styles.weekday}>{tile.weekday}</span>
          <span className={styles.day}>{tile.day}</span>
        </li>
      ))}
    </ul>
  );
}
