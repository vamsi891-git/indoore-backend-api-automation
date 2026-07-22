export const sampleConnectionStatusSuccess = {
  success: true as const,
  data: {
    items: [
      { id: 1, name: "Connected", shortName: "C" },
      { id: 2, name: "Disconnected", shortName: "D" },
      { id: 3, name: "Permanent Disconnection", shortName: "PD" },
    ],
  },
};

export const sampleNetworkHierarchySuccess = {
  success: true as const,
  data: {
    items: [
      { id: 1, code: "SS", name: "Sub Station", order: 1 },
      { id: 2, code: "FD", name: "Feeder", order: 2 },
      { id: 3, code: "DTR", name: "DTR", order: 3 },
    ],
  },
};
