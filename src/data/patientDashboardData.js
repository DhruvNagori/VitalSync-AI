
export const healthMetrics = [
  {
    id: 1,
    title: "Heart Rate",
    value: "78",
    unit: "BPM",
    status: "Sample reading",
    icon: "heart",
    color: "red"
  },
  {
    id: 2,
    title: "Blood Oxygen",
    value: "98",
    unit: "%",
    status: "Sample reading",
    icon: "oxygen",
    color: "blue"
  },
  {
    id: 3,
    title: "Daily Steps",
    value: "6,450",
    unit: "steps",
    status: "Demo activity",
    icon: "steps",
    color: "green"
  },
  {
    id: 4,
    title: "Sleep Duration",
    value: "7.2",
    unit: "hours",
    status: "Demo sleep data",
    icon: "sleep",
    color: "purple"
  }
];

export const heartRateData = [
  { time: "6 AM", value: 68 },
  { time: "8 AM", value: 72 },
  { time: "10 AM", value: 76 },
  { time: "12 PM", value: 81 },
  { time: "2 PM", value: 78 },
  { time: "4 PM", value: 75 },
  { time: "6 PM", value: 82 },
  { time: "8 PM", value: 74 }
];

export const oxygenData = [
  { time: "6 AM", value: 98 },
  { time: "8 AM", value: 97 },
  { time: "10 AM", value: 99 },
  { time: "12 PM", value: 98 },
  { time: "2 PM", value: 98 },
  { time: "4 PM", value: 97 },
  { time: "6 PM", value: 98 },
  { time: "8 PM", value: 99 }
];

export const activityData = [
  { day: "Mon", steps: 4200 },
  { day: "Tue", steps: 5800 },
  { day: "Wed", steps: 6500 },
  { day: "Thu", steps: 4900 },
  { day: "Fri", steps: 7200 },
  { day: "Sat", steps: 8100 },
  { day: "Sun", steps: 6450 }
];

export const recentActivities = [
  {
    id: 1,
    title: "Health overview viewed",
    description: "Patient dashboard demonstration",
    time: "Today",
    icon: "activity"
  },
  {
    id: 2,
    title: "AI assistant available",
    description: "Connect your health information for context",
    time: "Today",
    icon: "brain"
  },
  {
    id: 3,
    title: "Wearable connection pending",
    description: "No wearable device connected",
    time: "Today",
    icon: "watch"
  }
];
