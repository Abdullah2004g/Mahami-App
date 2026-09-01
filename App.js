import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert, I18nManager, Platform, Pressable, SafeAreaView, ScrollView,
  StyleSheet, Switch, Text, TextInput, View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Ionicons} from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import {Audio} from 'expo-av';
import {StatusBar} from 'expo-status-bar';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false
  })
});

const COLORS = {
  bg:'#F5F7FB', card:'#FFFFFF', text:'#172033', muted:'#718096',
  primary:'#5B5FEF', success:'#21A366', danger:'#E34D59',
  morning:'#FFF3C4', day:'#DDEEFF', evening:'#FCE1D3', night:'#202B4A'
};

function getGreeting(date=new Date()) {
  const h=date.getHours();
  if(h>=5 && h<12) return ['صباح الخير 👋','أتمنى لك يوماً مليئاً بالإنجاز','☀️','morning'];
  if(h>=12 && h<17) return ['نهارك سعيد ☀️','استمر في إنجاز مهامك','🌤️','day'];
  if(h>=17 && h<22) return ['مساء الخير 🌙','حان وقت ترتيب يومك','🌅','evening'];
  return ['مساء هادئ 🌙','استعد ليوم جديد','🌙','night'];
}
function pad(n){return String(n).padStart(2,'0')}
function formatTime(d){
  let h=d.getHours(), m=pad(d.getMinutes()), ap=h>=12?'م':'ص';
  h=h%12||12; return `${h}:${m} ${ap}`;
}
function formatDate(d){
  const days=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  return `${days[d.getDay()]}، ${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
}

export default function App(){
  const [now,setNow]=useState(new Date());
  const [tasks,setTasks]=useState([]);
  const [input,setInput]=useState('');
  const [screen,setScreen]=useState('home');
  const [theme,setTheme]=useState('light');
  const [sounds,setSounds]=useState(true);
  const [notifications,setNotifications]=useState(true);
  const [duration,setDuration]=useState(25*60);
  const [remaining,setRemaining]=useState(25*60);
  const [running,setRunning]=useState(false);

  useEffect(()=>{const t=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(t)},[]);
  useEffect(()=>{(async()=>{
    const saved=await AsyncStorage.getItem('mahami_tasks'); if(saved) setTasks(JSON.parse(saved));
    const settings=await AsyncStorage.getItem('mahami_settings');
    if(settings){const s=JSON.parse(settings); setTheme(s.theme||'light'); setSounds(s.sounds!==false); setNotifications(s.notifications!==false)}
    if(Platform.OS!=='web') await Notifications.requestPermissionsAsync();
  })()},[]);
  useEffect(()=>{AsyncStorage.setItem('mahami_tasks',JSON.stringify(tasks))},[tasks]);
  useEffect(()=>{AsyncStorage.setItem('mahami_settings',JSON.stringify({theme,sounds,notifications}))},[theme,sounds,notifications]);

  useEffect(()=>{
    if(!running) return;
    if(remaining<=0){
      setRunning(false); setRemaining(duration);
      if(sounds) playBeep();
      if(notifications && Platform.OS!=='web') Notifications.scheduleNotificationAsync({
        content:{title:'مهامي ⏰',body:'انتهى وقت التركيز 🎉',sound:'default'},
        trigger:null
      });
      Alert.alert('انتهى وقت التركيز 🎉','أحسنت! خذ استراحة قصيرة.');
      return;
    }
    const t=setInterval(()=>setRemaining(r=>r-1),1000); return()=>clearInterval(t);
  },[running,remaining,duration,sounds,notifications]);

  async function playBeep(){
    try{
      const {sound}=await Audio.Sound.createAsync(require('./assets/beep.mp3'));
      await sound.playAsync();
      setTimeout(()=>sound.unloadAsync(),1200);
    }catch(e){}
  }

  const completed=tasks.filter(t=>t.done).length;
  const remainingTasks=tasks.length-completed;
  const [title,subtitle,emoji,period]=getGreeting(now);
  const dark=theme==='dark';

  function addTask(){
    const v=input.trim(); if(!v) return;
    setTasks([{id:Date.now().toString(),title:v,done:false,created:new Date().toISOString()},...tasks]);
    setInput('');
  }
  function toggleTask(id){
    setTasks(tasks.map(t=>{
      if(t.id!==id) return t;
      const done=!t.done;
      if(done){
        if(sounds) playBeep();
        if(notifications && Platform.OS!=='web') Notifications.scheduleNotificationAsync({
          content:{title:'مهامي 🎉',body:'تم إنجاز المهمة',sound:'default'},trigger:null
        });
      }
      return {...t,done};
    }));
  }
  function deleteTask(id){
    Alert.alert('حذف المهمة','هل تريد حذف هذه المهمة؟',[
      {text:'إلغاء',style:'cancel'},{text:'حذف',style:'destructive',onPress:()=>setTasks(tasks.filter(t=>t.id!==id))}
    ]);
  }
  function clearAll(){
    if(!tasks.length) return;
    Alert.alert('حذف جميع المهام','سيتم حذف جميع المهام نهائياً.',[
      {text:'إلغاء',style:'cancel'},{text:'حذف الكل',style:'destructive',onPress:()=>setTasks([])}
    ]);
  }

  const bg = dark ? COLORS.night : ({morning:COLORS.morning,day:COLORS.day,evening:COLORS.evening,night:'#E7EBF7'}[period]);
  const textColor=dark?'#FFF':COLORS.text;
  const styles2=makeStyles(dark);

  return <SafeAreaView style={styles2.container}>
    <StatusBar style={dark?'light':'dark'}/>
    {screen==='home' && <ScrollView contentContainerStyle={{paddingBottom:100}}>
      <View style={[styles2.header,{backgroundColor:bg}]}>
        <View style={{flex:1}}>
          <Text style={[styles2.greeting,{color:period==='night'&&!dark?'#172033':textColor}]}>{title}</Text>
          <Text style={[styles2.subtitle,{color:period==='night'&&!dark?'#42506A':textColor}]}>{subtitle}</Text>
          <Text style={[styles2.date,{color:period==='night'&&!dark?'#42506A':textColor}]}>{formatDate(now)}</Text>
          <Text style={[styles2.clock,{color:period==='night'&&!dark?'#172033':textColor}]}>{formatTime(now)}</Text>
        </View>
        <Text style={styles2.bigEmoji}>{emoji}</Text>
      </View>

      <View style={styles2.welcome}>
        <Text style={styles2.welcomeTitle}>مرحباً بك في مهامي 👋</Text>
        <Text style={styles2.muted}>رتب يومك وأنجز مهامك بسهولة</Text>
      </View>

      <View style={styles2.statsRow}>
        <Stat title="إجمالي المهام" value={tasks.length} icon="list-outline" dark={dark}/>
        <Stat title="المكتملة" value={completed} icon="checkmark-circle-outline" dark={dark}/>
        <Stat title="المتبقية" value={remainingTasks} icon="time-outline" dark={dark}/>
      </View>

      <View style={styles2.addRow}>
        <TextInput value={input} onChangeText={setInput} onSubmitEditing={addTask}
          placeholder="اكتب مهمة جديدة..." placeholderTextColor={dark?'#9AA5BA':'#9AA5B8'}
          style={styles2.input} returnKeyType="done"/>
        <Pressable style={styles2.addBtn} onPress={addTask}><Text style={styles2.addText}>إضافة</Text></Pressable>
      </View>

      <View style={styles2.sectionHead}><Text style={styles2.sectionTitle}>مهامي اليوم</Text>
        <Pressable onPress={()=>setScreen('tasks')}><Text style={styles2.link}>عرض الكل</Text></Pressable>
      </View>

      {tasks.slice(0,5).map(t=><TaskCard key={t.id} t={t} onToggle={()=>toggleTask(t.id)} onDelete={()=>deleteTask(t.id)} dark={dark}/>)}
      {!tasks.length && <EmptyState dark={dark}/>}
    </ScrollView>}

    {screen==='tasks' && <ScrollView contentContainerStyle={{padding:18,paddingBottom:100}}>
      <Text style={styles2.pageTitle}>المهام</Text>
      <View style={styles2.addRow}><TextInput value={input} onChangeText={setInput} placeholder="اكتب مهمة جديدة..." placeholderTextColor={dark?'#9AA5BA':'#9AA5B8'} style={styles2.input}/><Pressable style={styles2.addBtn} onPress={addTask}><Text style={styles2.addText}>إضافة</Text></Pressable></View>
      {tasks.map(t=><TaskCard key={t.id} t={t} onToggle={()=>toggleTask(t.id)} onDelete={()=>deleteTask(t.id)} dark={dark}/>)}
      {!tasks.length && <EmptyState dark={dark}/>}
      {!!tasks.length && <Pressable onPress={clearAll} style={styles2.clearBtn}><Text style={{color:COLORS.danger,fontWeight:'700'}}>حذف جميع المهام</Text></Pressable>}
    </ScrollView>}

    {screen==='focus' && <View style={styles2.focus}>
      <Text style={styles2.pageTitle}>تايمر التركيز</Text>
      <Text style={styles2.focusTime}>{pad(Math.floor(remaining/60))}:{pad(remaining%60)}</Text>
      <Text style={styles2.muted}>اختر مدة التركيز</Text>
      <View style={styles2.durationRow}>{[15,25,45,60].map(min=><Pressable key={min} onPress={()=>{setRunning(false);setDuration(min*60);setRemaining(min*60)}} style={[styles2.duration,{backgroundColor:duration===min*60?COLORS.primary:(dark?'#303B58':'#E9ECF7')}]}><Text style={{color:duration===min*60?'#FFF':textColor,fontWeight:'700'}}>{min} د</Text></Pressable>)}</View>
      <View style={{flexDirection:'row',gap:10,marginTop:25}}>
        <Pressable style={styles2.timerBtn} onPress={()=>setRunning(!running)}><Text style={styles2.timerBtnText}>{running?'إيقاف مؤقت':'بدء'}</Text></Pressable>
        <Pressable style={styles2.resetBtn} onPress={()=>{setRunning(false);setRemaining(duration)}}><Text style={{fontWeight:'700',color:textColor}}>إعادة ضبط</Text></Pressable>
      </View>
    </View>}

    {screen==='settings' && <ScrollView contentContainerStyle={{padding:18,paddingBottom:100}}>
      <Text style={styles2.pageTitle}>الإعدادات</Text>
      <SettingRow title="الصوت" subtitle="أصوات إكمال المهمة والمؤقت" value={sounds} setValue={setSounds} dark={dark}/>
      <SettingRow title="الإشعارات" subtitle="الإشعارات المحلية" value={notifications} setValue={setNotifications} dark={dark}/>
      <View style={styles2.settingCard}><Text style={styles2.settingTitle}>المظهر</Text>
        <View style={{flexDirection:'row',gap:8,marginTop:12}}>
          {['light','dark'].map(v=><Pressable key={v} onPress={()=>setTheme(v)} style={[styles2.themeBtn,{backgroundColor:theme===v?COLORS.primary:(dark?'#303B58':'#EDF0F7')}]}><Text style={{color:theme===v?'#FFF':textColor,fontWeight:'700'}}>{v==='light'?'فاتح':'داكن'}</Text></Pressable>)}
        </View>
      </View>
      <Pressable onPress={clearAll} style={styles2.dangerCard}><Ionicons name="trash-outline" size={22} color={COLORS.danger}/><Text style={{color:COLORS.danger,fontWeight:'800'}}>حذف جميع المهام</Text></Pressable>
    </ScrollView>}

    <View style={styles2.nav}>
      <NavItem icon="home-outline" label="الرئيسية" active={screen==='home'} onPress={()=>setScreen('home')} dark={dark}/>
      <NavItem icon="checkmark-done-outline" label="المهام" active={screen==='tasks'} onPress={()=>setScreen('tasks')} dark={dark}/>
      <NavItem icon="timer-outline" label="التركيز" active={screen==='focus'} onPress={()=>setScreen('focus')} dark={dark}/>
      <NavItem icon="settings-outline" label="الإعدادات" active={screen==='settings'} onPress={()=>setScreen('settings')} dark={dark}/>
    </View>
  </SafeAreaView>
}

function Stat({title,value,icon,dark}){return <View style={makeStyles(dark).stat}><Ionicons name={icon} size={23} color={COLORS.primary}/><Text style={makeStyles(dark).statValue}>{value}</Text><Text style={makeStyles(dark).statTitle}>{title}</Text></View>}
function TaskCard({t,onToggle,onDelete,dark}){
  const s=makeStyles(dark);
  return <View style={s.task}><Pressable onPress={onToggle} style={[s.checkbox,{backgroundColor:t.done?COLORS.success:'transparent',borderColor:t.done?COLORS.success:COLORS.muted}]}>{t.done&&<Ionicons name="checkmark" size={16} color="#FFF"/>}</Pressable><View style={{flex:1}}><Text style={[s.taskTitle,t.done&&{textDecorationLine:'line-through',color:COLORS.muted}]}>{t.title}</Text><Text style={s.taskDate}>{formatTime(new Date(t.created))}</Text></View><Pressable onPress={onDelete}><Ionicons name="trash-outline" size={21} color={COLORS.danger}/></Pressable></View>
}
function EmptyState({dark}){return <View style={makeStyles(dark).empty}><Text style={{fontSize:45}}>📝</Text><Text style={makeStyles(dark).emptyTitle}>لا توجد مهام حالياً</Text><Text style={makeStyles(dark).muted}>ابدأ بإضافة أول مهمة لك اليوم 🚀</Text></View>}
function SettingRow({title,subtitle,value,setValue,dark}){return <View style={makeStyles(dark).settingCard}><View style={{flex:1}}><Text style={makeStyles(dark).settingTitle}>{title}</Text><Text style={makeStyles(dark).muted}>{subtitle}</Text></View><Switch value={value} onValueChange={setValue}/></View>}
function NavItem({icon,label,active,onPress,dark}){return <Pressable onPress={onPress} style={{alignItems:'center',flex:1}}><Ionicons name={icon} size={23} color={active?COLORS.primary:(dark?'#AAB4C8':'#7B8497')}/><Text style={{fontSize:11,color:active?COLORS.primary:(dark?'#AAB4C8':'#7B8497'),marginTop:3}}>{label}</Text></Pressable>}

function makeStyles(dark){
 const c=dark?'#FFF':COLORS.text, card=dark?'#27324D':'#FFF', bg=dark?'#151B2B':COLORS.bg, muted=dark?'#AAB4C8':COLORS.muted;
 return StyleSheet.create({
  container:{flex:1,backgroundColor:bg},
  header:{margin:12,borderRadius:25,padding:22,minHeight:180,flexDirection:'row',alignItems:'center',overflow:'hidden'},
  greeting:{fontSize:29,fontWeight:'900',marginBottom:5},subtitle:{fontSize:14,fontWeight:'600'},date:{fontSize:13,marginTop:18},clock:{fontSize:22,fontWeight:'800',marginTop:3},bigEmoji:{fontSize:64},
  welcome:{marginHorizontal:16,marginTop:4,padding:18,backgroundColor:card,borderRadius:20},welcomeTitle:{fontSize:20,fontWeight:'800',color:c},muted:{color:muted,fontSize:13,marginTop:4},
  statsRow:{flexDirection:'row',gap:9,padding:16},stat:{flex:1,backgroundColor:card,borderRadius:18,padding:13,alignItems:'center'},statValue:{fontSize:25,fontWeight:'900',color:c,marginTop:3},statTitle:{fontSize:11,color:muted,marginTop:3,textAlign:'center'},
  addRow:{flexDirection:'row',gap:8,paddingHorizontal:16,marginTop:2},input:{flex:1,backgroundColor:card,borderRadius:15,paddingHorizontal:15,height:50,color:c,textAlign:'right'},addBtn:{backgroundColor:COLORS.primary,borderRadius:15,height:50,paddingHorizontal:20,alignItems:'center',justifyContent:'center'},addText:{color:'#FFF',fontWeight:'800'},
  sectionHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:18,marginTop:22,marginBottom:10},sectionTitle:{fontSize:20,fontWeight:'900',color:c},link:{color:COLORS.primary,fontWeight:'700'},
  task:{marginHorizontal:16,marginBottom:9,padding:15,backgroundColor:card,borderRadius:17,flexDirection:'row',alignItems:'center',gap:12},checkbox:{width:24,height:24,borderWidth:2,borderRadius:8,alignItems:'center',justifyContent:'center'},taskTitle:{fontSize:15,fontWeight:'700',color:c,textAlign:'right'},taskDate:{fontSize:11,color:muted,marginTop:4,textAlign:'right'},
  empty:{margin:16,padding:35,alignItems:'center',backgroundColor:card,borderRadius:20},emptyTitle:{fontSize:18,fontWeight:'800',color:c,marginTop:10},
  pageTitle:{fontSize:29,fontWeight:'900',color:c,marginBottom:20},focus:{flex:1,alignItems:'center',paddingTop:45},focusTime:{fontSize:64,fontWeight:'900',color:c,marginVertical:25},durationRow:{flexDirection:'row',gap:8,marginTop:15},duration:{paddingHorizontal:16,paddingVertical:12,borderRadius:14},timerBtn:{backgroundColor:COLORS.primary,paddingHorizontal:35,paddingVertical:15,borderRadius:15},timerBtnText:{color:'#FFF',fontWeight:'900'},resetBtn:{backgroundColor:card,paddingHorizontal:25,paddingVertical:15,borderRadius:15},
  settingCard:{backgroundColor:card,borderRadius:18,padding:18,marginBottom:12,flexDirection:'row',alignItems:'center'},settingTitle:{fontSize:17,fontWeight:'800',color:c},themeBtn:{paddingHorizontal:25,paddingVertical:12,borderRadius:13},dangerCard:{backgroundColor:card,borderRadius:18,padding:18,flexDirection:'row',gap:12,alignItems:'center'},clearBtn:{margin:16,padding:15,alignItems:'center',backgroundColor:card,borderRadius:15},
  nav:{position:'absolute',bottom:0,left:0,right:0,height:70,backgroundColor:card,borderTopWidth:1,borderTopColor:dark?'#303B58':'#E7EAF0',flexDirection:'row',alignItems:'center',paddingHorizontal:8}
 });
}