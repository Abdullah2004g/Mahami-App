import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Switch,
  Alert,
  Platform
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

const TASKS_KEY = "@mahami_tasks";
const SETTINGS_KEY = "@mahami_settings";

export default function App() {
  const [screen, setScreen] = useState("home");
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [now, setNow] = useState(new Date());

  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    sounds: true
  });

  const [timerMinutes, setTimerMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    loadData();
    requestNotificationPermission();

    const clock = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;

    if (secondsLeft <= 0) {
      setTimerRunning(false);
      finishTimer();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning, secondsLeft]);

  const loadData = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem(TASKS_KEY);
      const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);

      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }

      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const saveTasks = async (data) => {
    setTasks(data);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(data));
  };

  const saveSettings = async (data) => {
    setSettings(data);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "مهامي",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: "default"
      });
    }

    const permissions = await Notifications.getPermissionsAsync();

    if (permissions.status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }
  };

  const addTask = async () => {
    const title = newTask.trim();

    if (!title) {
      Alert.alert("تنبيه", "اكتب المهمة أولاً");
      return;
    }

    const task = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toISOString()
    };

    await saveTasks([task, ...tasks]);
    setNewTask("");
  };

  const toggleTask = async (id) => {
    const updated = tasks.map((task) =>
      task.id === id
        ? { ...task, completed: !task.completed }
        : task
    );

    await saveTasks(updated);
  };

  const deleteTask = async (id) => {
    const updated = tasks.filter((task) => task.id !== id);
    await saveTasks(updated);
  };

  const deleteAllTasks = () => {
    Alert.alert(
      "حذف المهام",
      "هل تريد حذف جميع المهام؟",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            await saveTasks([]);
          }
        }
      ]
    );
  };

  const finishTimer = async () => {
    if (settings.notifications) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "مهامي ⏰",
          body: "انتهى وقت التركيز! خذ استراحة قصيرة."
        },
        trigger: null
      });
    }

    Alert.alert("انتهى الوقت ⏰", "أحسنت! انتهت جلسة التركيز.");
  };

  const changeTimer = (minutes) => {
    setTimerMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setTimerRunning(false);
  };

  const resetTimer = () => {
    setTimerRunning(false);
    setSecondsLeft(timerMinutes * 60);
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;

    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const hour = now.getHours();

  let greeting = "";
  let subtitle = "";
  let icon = "sunny";

  if (hour >= 5 && hour < 12) {
    greeting = "صباح الخير 👋";
    subtitle = "أتمنى لك يوماً مليئاً بالإنجاز";
    icon = "sunny";
  } else if (hour >= 12 && hour < 17) {
    greeting = "نهارك سعيد ☀️";
    subtitle = "استمر في إنجاز مهامك";
    icon = "partly-sunny";
  } else if (hour >= 17 && hour < 22) {
    greeting = "مساء الخير 🌙";
    subtitle = "حان وقت ترتيب يومك";
    icon = "moon";
  } else {
    greeting = "مساء هادئ 🌙";
    subtitle = "استعد ليوم جديد";
    icon = "moon";
  }

  const completed = tasks.filter((task) => task.completed).length;
  const remaining = tasks.length - completed;

  const dateText = now.toLocaleDateString("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const dark = settings.darkMode;

  const colors = {
    background: dark ? "#101114" : "#F6F7FB",
    card: dark ? "#1A1C21" : "#FFFFFF",
    text: dark ? "#FFFFFF" : "#15171A",
    secondary: dark ? "#A9ADB5" : "#6B7280",
    border: dark ? "#2A2D34" : "#E7E9EE",
    primary: "#4F46E5"
  };

  const renderTask = ({ item }) => (
    <View
      style={[
        styles.taskCard,
        {
          backgroundColor: colors.card,
          borderColor: colors.border
        }
      ]}
    >
      <TouchableOpacity
        style={styles.checkButton}
        onPress={() => toggleTask(item.id)}
      >
        <Ionicons
          name={item.completed ? "checkmark-circle" : "ellipse-outline"}
          size={27}
          color={item.completed ? colors.primary : colors.secondary}
        />
      </TouchableOpacity>

      <View style={styles.taskTextContainer}>
        <Text
          style={[
            styles.taskTitle,
            {
              color: colors.text,
              textDecorationLine: item.completed
                ? "line-through"
                : "none"
            }
          ]}
        >
          {item.title}
        </Text>

        <Text style={[styles.taskDate, { color: colors.secondary }]}>
          {new Date(item.createdAt).toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit"
          })}
        </Text>
      </View>

      <TouchableOpacity onPress={() => deleteTask(item.id)}>
        <Ionicons
          name="trash-outline"
          size={21}
          color="#EF4444"
        />
      </TouchableOpacity>
    </View>
  );

  const HomeScreen = () => (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>{greeting}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
          <Text style={styles.date}>{dateText}</Text>
          <Text style={styles.clock}>
            {now.toLocaleTimeString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            })}
          </Text>
        </View>

        <Ionicons name={icon} size={54} color="#FFFFFF" />
      </View>

      <View style={styles.welcomeCard}>
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>
          مرحباً 👋
        </Text>

        <Text style={[styles.welcomeText, { color: colors.secondary }]}>
          رتب يومك وأنجز مهامك بسهولة
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard title="إجمالي المهام" value={tasks.length} />
        <StatCard title="المكتملة" value={completed} />
        <StatCard title="المتبقية" value={remaining} />
      </View>

      <View
        style={[
          styles.addContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border
          }
        ]}
      >
        <TextInput
          value={newTask}
          onChangeText={setNewTask}
          placeholder="اكتب مهمة جديدة..."
          placeholderTextColor={colors.secondary}
          style={[styles.input, { color: colors.text }]}
          textAlign="right"
        />

        <TouchableOpacity
          style={styles.addButton}
          onPress={addTask}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        آخر المهام
      </Text>

      <FlatList
        data={tasks.slice(0, 5)}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="checkmark-done-circle-outline"
              size={65}
              color={colors.secondary}
            />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              لا توجد مهام حالياً
            </Text>
          </View>
        }
      />
    </View>
  );

  const TasksScreen = () => (
    <View style={styles.screen}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>
        المهام
      </Text>

      <View
        style={[
          styles.addContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border
          }
        ]}
      >
        <TextInput
          value={newTask}
          onChangeText={setNewTask}
          placeholder="اكتب مهمة جديدة..."
          placeholderTextColor={colors.secondary}
          style={[styles.input, { color: colors.text }]}
          textAlign="right"
        />

        <TouchableOpacity
          style={styles.addButton}
          onPress={addTask}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
          <Text style={styles.addButtonText}>إضافة</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="clipboard-outline"
              size={65}
              color={colors.secondary}
            />
            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              لم تضف أي مهمة بعد
            </Text>
          </View>
        }
      />
    </View>
  );

  const FocusScreen = () => (
    <View style={styles.screen}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>
        التركيز
      </Text>

      <View
        style={[
          styles.timerCard,
          { backgroundColor: colors.card }
        ]}
      >
        <Text style={[styles.timerLabel, { color: colors.secondary }]}>
          جلسة التركيز
        </Text>

        <Text style={[styles.timer, { color: colors.text }]}>
          {formatTime(secondsLeft)}
        </Text>

        <View style={styles.timerOptions}>
          {[15, 25, 45, 60].map((minute) => (
            <TouchableOpacity
              key={minute}
              onPress={() => changeTimer(minute)}
              style={[
                styles.timerOption,
                timerMinutes === minute && styles.timerOptionActive
              ]}
            >
              <Text
                style={[
                  styles.timerOptionText,
                  timerMinutes === minute &&
                    styles.timerOptionTextActive
                ]}
              >
                {minute}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.timerButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setTimerRunning(!timerRunning)}
          >
            <Ionicons
              name={timerRunning ? "pause" : "play"}
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.primaryButtonText}>
              {timerRunning ? "إيقاف" : "بدء"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={resetTimer}
          >
            <Ionicons
              name="refresh"
              size={22}
              color={colors.text}
            />
            <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
              إعادة
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const SettingsScreen = () => (
    <View style={styles.screen}>
      <Text style={[styles.pageTitle, { color: colors.text }]}>
        الإعدادات
      </Text>

      <SettingRow
        title="الوضع الداكن"
        icon="moon-outline"
        value={settings.darkMode}
        onChange={(value) =>
          saveSettings({
            ...settings,
            darkMode: value
          })
        }
        colors={colors}
      />

      <SettingRow
        title="الإشعارات"
        icon="notifications-outline"
        value={settings.notifications}
        onChange={(value) =>
          saveSettings({
            ...settings,
            notifications: value
          })
        }
        colors={colors}
      />

      <TouchableOpacity
        style={[
          styles.deleteAllButton,
          { backgroundColor: colors.card }
        ]}
        onPress={deleteAllTasks}
      >
        <Ionicons name="trash-outline" size={22} color="#EF4444" />
        <Text style={styles.deleteAllText}>
          حذف جميع المهام
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background }
      ]}
    >
      <StatusBar style={dark ? "light" : "dark"} />

      {screen === "home" && <HomeScreen />}
      {screen === "tasks" && <TasksScreen />}
      {screen === "focus" && <FocusScreen />}
      {screen === "settings" && <SettingsScreen />}

      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border
          }
        ]}
      >
        <NavButton
          icon="home-outline"
          active={screen === "home"}
          title="الرئيسية"
          onPress={() => setScreen("home")}
          colors={colors}
        />

        <NavButton
          icon="list-outline"
          active={screen === "tasks"}
          title="المهام"
          onPress={() => setScreen("tasks")}
          colors={colors}
        />

        <NavButton
          icon="timer-outline"
          active={screen === "focus"}
          title="التركيز"
          onPress={() => setScreen("focus")}
          colors={colors}
        />

        <NavButton
          icon="settings-outline"
          active={screen === "settings"}
          title="الإعدادات"
          onPress={() => setScreen("settings")}
          colors={colors}
        />
      </View>
    </View>
  );
}

function StatCard({ title, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function SettingRow({ title, icon, value, onChange, colors }) {
  return (
    <View
      style={[
        styles.settingRow,
        {
          backgroundColor: colors.card,
          borderColor: colors.border
        }
      ]}
    >
      <Ionicons
        name={icon}
        size={25}
        color={colors.text}
      />

      <Text style={[styles.settingTitle, { color: colors.text }]}>
        {title}
      </Text>

      <Switch
        value={value}
        onValueChange={onChange}
      />
    </View>
  );
}

function NavButton({ icon, active, title, onPress, colors }) {
  return (
    <TouchableOpacity
      style={styles.navButton}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={24}
        color={active ? colors.primary : colors.secondary}
      />

      <Text
        style={[
          styles.navText,
          {
            color: active
              ? colors.primary
              : colors.secondary
          }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },

  screen: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 55,
    paddingBottom: 90
  },

  header: {
    backgroundColor: "#4F46E5",
    borderRadius: 25,
    padding: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15
  },

  headerGreeting: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    textAlign: "right"
  },

  headerSubtitle: {
    color: "#E0E7FF",
    fontSize: 14,
    marginTop: 5,
    textAlign: "right"
  },

  date: {
    color: "#E0E7FF",
    fontSize: 12,
    marginTop: 10,
    textAlign: "right"
  },

  clock: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 3,
    textAlign: "right"
  },

  welcomeCard: {
    paddingVertical: 15
  },

  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "right"
  },

  welcomeText: {
    marginTop: 4,
    textAlign: "right"
  },

  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: "center"
  },

  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4F46E5"
  },

  statTitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4
  },

  addContainer: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18
  },

  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15
  },

  addButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },

  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "700"
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "right"
  },

  pageTitle: {
    fontSize: 29,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "right"
  },

  taskCard: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 14,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center"
  },

  checkButton: {
    marginRight: 10
  },

  taskTextContainer: {
    flex: 1
  },

  taskTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "right"
  },

  taskDate: {
    fontSize: 11,
    marginTop: 3,
    textAlign: "right"
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 55
  },

  emptyText: {
    marginTop: 12,
    fontSize: 15
  },

  timerCard: {
    borderRadius: 25,
    padding: 25,
    alignItems: "center"
  },

  timerLabel: {
    fontSize: 15
  },

  timer: {
    fontSize: 62,
    fontWeight: "800",
    marginVertical: 20
  },

  timerOptions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 25
  },

  timerOption: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#E5E7EB"
  },

  timerOptionActive: {
    backgroundColor: "#4F46E5"
  },

  timerOptionText: {
    fontWeight: "700",
    color: "#374151"
  },

  timerOptionTextActive: {
    color: "#FFFFFF"
  },

  timerButtons: {
    flexDirection: "row",
    gap: 10
  },

  primaryButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800"
  },

  secondaryButton: {
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 7
  },

  secondaryButtonText: {
    fontWeight: "800"
  },

  settingRow: {
    borderWidth: 1,
    borderRadius: 17,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },

  settingTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right"
  },

  deleteAllButton: {
    marginTop: 10,
    padding: 17,
    borderRadius: 17,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },

  deleteAllText: {
    color: "#EF4444",
    fontWeight: "800"
  },

  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 75,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center"
  },

  navButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70
  },

  navText: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: "700"
  }
});
