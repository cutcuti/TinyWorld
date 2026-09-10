import { plantWilt, type Plant, type Season } from "./simulation";
export function visitorHabitat(plants: Plant[], time: number, season: Season) {
  const healthy = plants.filter((p) => p.growth >= 0.85 && plantWilt(p) < 0.4);
  const lush = healthy.length >= 10;
  const dusk = time >= 17.5 || time < 5.5;
  return {
    lush,
    birds: lush && !dusk ? healthy.filter((p) => p.kind === "tree") : [],
    snails:
      lush && !dusk && season !== 3
        ? healthy.filter((p) => p.kind !== "lotus")
        : [],
    fireflies: lush && dusk && season !== 3,
  };
}
