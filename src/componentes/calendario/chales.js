const chales = [
  // Cabana Vermelha 1 até 10 – capacidade 4 pessoas
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `${i + 1}`,
    title: `Cabana Vermelha ${i + 1}`,
    capacidade: 4,
  })),

  // Cabana 11 – Casa d'Água – capacidade 7 pessoas
  {
    id: "11",
    title: "Cabana Vermelha (Casa d'Água)",
    capacidade: 7,
  },

  // Cabana Vermelha 12 até 14 – capacidade 4 pessoas
  ...Array.from({ length: 3 }, (_, i) => ({
    id: `${12 + i}`,
    title: `Cabana Vermelha ${12 + i}`,
    capacidade: 4,
  })),

  // Cabana Campeira – capacidade 12 pessoas
  {
    id: "15",
    title: "Cabana Campeira",
    capacidade: 12,
  },
];

export default chales;
