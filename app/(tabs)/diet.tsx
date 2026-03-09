import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";

const T = {
  leaf:"#22543d", leafMid:"#276749", sage:"#48bb78", sagePale:"#d4edda",
  gold:"#b7791f", parchment:"#faf7f0", bark:"#744210",
  inkDark:"#1a202c", inkMid:"#2d3748", inkLight:"#718096",
  border:"#e2e8f0", borderGreen:"#9ae6b4", white:"#ffffff",
  redSoft:"#fc8181", redPale:"#fff5f5", errorRed:"#c53030", bg:"#f1f8e9",
};

type MealItem = { dish: string; portion_pct: number };
type RasaGrouped = Record<string, MealItem[]>;
type FormData = { age:string; gender:string; weight:string; height:string; disease:string; mealCategory:string; foodPreference:string };
type ResultData = {
  user_bmi:number; predicted_bmi_category:string; meal_category:string;
  diet_preference:string; disease:string; foods_to_avoid:string;
  meal_plan:MealItem[]; totals:{calories_kcal:number;protein_g:number;carbs_g:number;fats_g:number};
};

const DISEASES = ["diabetes","migraine","arthritis","asthma","gastritis","hypertension","obesity"];
const MEALS    = ["breakfast","lunch","dinner"];
const PREFS    = ["veg","non-veg"];
const GENDERS  = ["male","female"];
const ALL_RASAS = ["sweet","sour","salty","pungent","bitter","astringent"];

const RASA_LABEL:Record<string,string> = {
  sweet:"Sweet (Madhura)",sour:"Sour (Amla)",salty:"Salty (Lavana)",
  pungent:"Pungent (Katu)",bitter:"Bitter (Tikta)",astringent:"Astringent (Kashaya)",
};
const RASA_COLOR:Record<string,string> = {
  sweet:"#d69e2e",sour:"#e53e3e",salty:"#3182ce",pungent:"#c53030",bitter:"#38a169",astringent:"#805ad5",
};
const RASA_BG:Record<string,string> = {
  sweet:"#fffbeb",sour:"#fff5f5",salty:"#ebf8ff",pungent:"#fff5f5",bitter:"#f0fff4",astringent:"#faf5ff",
};
const DISEASE_TIPS:Record<string,string[]> = {
  diabetes:["Prefer bitter & astringent tastes to balance blood sugar.","Eat at fixed times daily.","Avoid heavy dinners after 7 PM."],
  hypertension:["Reduce salt & pungent foods to calm Pitta.","Include cooling herbs like coriander and fennel.","Practice mindful, slow eating."],
  obesity:["Favour warm, light meals to kindle Agni.","Eat only when genuinely hungry.","Include digestive spices: ginger, cumin, black pepper."],
  migraine:["Avoid fermented, aged, and sour foods.","Stay hydrated with warm water and herbal teas.","Maintain a consistent sleep-wake schedule."],
  arthritis:["Favour warm, cooked foods over raw and cold.","Include anti-inflammatory spices: turmeric, ginger.","Avoid nightshades when possible."],
  gastritis:["Eat small, frequent meals.","Choose cooling, soothing foods: coconut, coriander.","Avoid spicy, fried, and very sour foods."],
};

function cleanDishName(n:string){return n.replace(/\s*\(.*?\)\s*/g,"").trim();}
function norm(s:string){return String(s||"").toLowerCase().trim().replace(/\s+/g," ");}
function tasteToKey(t:string){
  const x=String(t||"").toLowerCase();
  if(x.includes("sweet"))return "sweet"; if(x.includes("sour"))return "sour";
  if(x.includes("salty"))return "salty"; if(x.includes("pungent"))return "pungent";
  if(x.includes("bitter"))return "bitter"; if(x.includes("astringent"))return "astringent";
  return "unknown";
}
function calcGrams({age,gender,weight_kg,height_cm,bmiCategory,mealCategory,mealCalories}:{age:number;gender:string;weight_kg:number;height_cm:number;bmiCategory:string;mealCategory:string;mealCalories:number}){
  const bmr=gender.toLowerCase()==="male"?10*weight_kg+6.25*height_cm-5*age+5:10*weight_kg+6.25*height_cm-5*age-161;
  const adj:Record<string,number>={underweight:1.15,normal:1.0,overweight:0.9,obese:0.8};
  const frac:Record<string,number>={breakfast:0.25,lunch:0.35,dinner:0.3};
  const budget=bmr*1.2*(adj[bmiCategory?.toLowerCase()]??1.0)*(frac[mealCategory?.toLowerCase()]??0.3);
  return Math.min(Math.max(Math.round(budget/(mealCalories>0?mealCalories/500:1.0)),150),1200);
}
function ptg(pct:number,total:number){return Math.round((pct/100)*total);}

function parseCSV(text:string):Map<string,string>{
  const map=new Map<string,string>();
  const lines=text.split("\n").filter(Boolean);
  if(lines.length<2)return map;
  const headers=lines[0].split(",").map(h=>h.trim().toLowerCase());
  const fi=headers.findIndex(h=>h.includes("food"));
  const ti=headers.findIndex(h=>h.includes("taste")||h.includes("ayurvedic"));
  if(fi===-1||ti===-1)return map;
  for(let i=1;i<lines.length;i++){
    const cols=lines[i].split(",");
    const food=norm(cols[fi]??"");
    const taste=cols[ti]?.trim()??"";
    if(food)map.set(food,tasteToKey(taste));
  }
  return map;
}

function buildPDF(result:ResultData,formData:FormData,rg:RasaGrouped,tmg:number):string{
  const cap=(s:string)=>s?s.charAt(0).toUpperCase()+s.slice(1):"—";
  const date=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});
  const bc=(result.predicted_bmi_category||"").toLowerCase();
  const bh=bc==="normal"?"#38a169":bc==="underweight"?"#d69e2e":bc==="overweight"?"#ed8936":"#e53e3e";
  const avoid=(result.foods_to_avoid?String(result.foods_to_avoid).split(","):[]).map(s=>s.trim()).filter(Boolean);
  const mealRows=(result.meal_plan||[]).map((item,i)=>{
    const g=ptg(item.portion_pct,tmg);
    return `<tr style="background:${i%2===0?"#f8fffc":"#fff"}"><td style="padding:8px 10px;font-size:13px">${item.dish}</td>
    <td style="padding:8px 10px;text-align:center"><b style="color:#22543d">${item.portion_pct}%</b>
    <div style="margin-top:4px;background:#e2e8f0;border-radius:99px;height:5px"><div style="background:#48bb78;height:5px;border-radius:99px;width:${Math.min(100,item.portion_pct)}%"></div></div></td>
    <td style="padding:8px 10px;text-align:center"><span style="background:#d4edda;color:#22543d;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;border:1px solid #9ae6b4">${g} g</span></td></tr>`;
  }).join("");
  const rasaRows=ALL_RASAS.map(rasa=>{
    const items=rg[rasa]??[];
    const col=RASA_COLOR[rasa],bg=RASA_BG[rasa];
    const content=items.length===0?`<span style="color:#a0aec0;font-style:italic;font-size:12px">No dishes from your meal plan</span>`:
      items.map(item=>`<div style="font-size:12px;color:#2d3748;margin-bottom:3px">• ${item.dish} <span style="color:#718096">(${item.portion_pct}% · ${ptg(item.portion_pct,tmg)}g)</span></div>`).join("");
    return `<tr style="background:${bg}"><td style="padding:10px;border-left:4px solid ${col};font-weight:700;color:${col};font-size:13px;white-space:nowrap;vertical-align:top">${RASA_LABEL[rasa]}</td><td style="padding:10px;vertical-align:top">${content}</td></tr>`;
  }).join("");
  const unk=rg["unknown"]??[];
  const unkRow=unk.length>0?`<tr style="background:#fefcbf"><td style="padding:10px;border-left:4px solid #d69e2e;font-weight:700;color:#d69e2e;font-size:13px;white-space:nowrap;vertical-align:top">Not Defined</td><td style="padding:10px;vertical-align:top">${unk.map(item=>`<div style="font-size:12px;color:#2d3748;margin-bottom:3px">• ${item.dish} <span style="color:#718096">(${item.portion_pct}% · ${ptg(item.portion_pct,tmg)}g)</span></div>`).join("")}</td></tr>`:"";
  const tips=DISEASE_TIPS[(result.disease||"").toLowerCase()]||["Follow seasonal eating aligned with your local climate.","Chew food thoroughly — digestion begins in the mouth.","Drink warm water with meals; avoid cold beverages."];
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;background:#faf7f0;color:#1a202c}
.page{max-width:800px;margin:0 auto}.banner{background:#22543d;padding:32px 40px 28px}
.stripe{height:4px;background:#b7791f;margin-bottom:20px}.banner h1{font-size:26px;color:#fffff0;font-weight:bold;text-align:center}
.banner p{font-size:12px;color:#c6f6d5;text-align:center;margin-top:6px;font-style:italic}
.sub{font-size:11px;color:#9ae6b4;text-align:center;margin-top:4px}.content{padding:28px 40px}
.sec{margin-bottom:28px}.hdr{padding:7px 14px;border-radius:6px;font-size:11px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:#fff;margin-bottom:14px}
.green{background:#22543d}.gold{background:#b7791f}.red{background:#c53030}.sage{background:#38a169}
.pgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px 20px}
.prow{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e2e8f0}
.pl{font-size:12px;color:#718096}.pv{font-size:12px;font-weight:600}
.bmi-badge{display:inline-flex;align-items:center;gap:10px;background:${bh}18;border:2px solid ${bh};border-radius:12px;padding:12px 20px;margin-top:10px}
.bmi-n{font-size:36px;font-weight:800;color:${bh};line-height:1}.bmi-c{font-size:14px;font-weight:700;color:${bh}}
.mt{width:100%;border-collapse:collapse}.mt th{background:#d4edda;color:#22543d;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;padding:9px 10px;text-align:left}
.mt th:not(:first-child){text-align:center}.mt td{border-bottom:1px solid #e2e8f0}
.tr-total td{background:#d4edda;font-weight:700;color:#22543d;padding:8px 10px;font-size:13px}
.cap{font-size:11px;color:#718096;margin-top:8px;font-style:italic}
.ng{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
.nb{border-radius:10px;padding:14px;text-align:center;border:2px solid}.nv{font-size:22px;font-weight:800}.nu{font-size:11px;color:#718096;margin-top:2px}
.mr{margin-bottom:10px}.mh{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}
.mtr{background:#e2e8f0;border-radius:99px;height:6px}.mf{height:6px;border-radius:99px}
.aw{display:flex;flex-wrap:wrap;gap:8px}.ap{background:#fff5f5;border:1px solid #fc8181;color:#c53030;font-size:12px;font-weight:500;padding:4px 12px;border-radius:99px}
.rt{width:100%;border-collapse:collapse}.rt td{border-bottom:1px solid #e2e8f0;vertical-align:top}
.tr{display:flex;gap:10px;align-items:flex-start;margin-bottom:10px}
.td{width:8px;height:8px;background:#48bb78;border-radius:50%;flex-shrink:0;margin-top:4px}
.tt{font-size:13px;color:#2d3748;line-height:1.6}
.foot{background:#22543d;color:#c6f6d5;font-size:10px;text-align:center;padding:12px 20px;margin-top:28px}
</style></head><body><div class="page">
<div class="banner"><div class="stripe"></div><h1>Ayurvedic Diet Plan Report</h1>
<p>Personalised Wellness · Rooted in Ancient Wisdom</p>
<div class="sub">Generated on ${date} &nbsp;·&nbsp; Developed by Dias W A N M (IT22899910)</div></div>
<div class="content">
<div class="sec"><div class="hdr green">Patient Profile</div>
<div class="pgrid">
<div>${[["Age",`${formData.age} years`],["Gender",cap(formData.gender)],["Weight",`${formData.weight} kg`],["Height",`${formData.height} cm`]].map(([l,v])=>`<div class="prow"><span class="pl">${l}</span><span class="pv">${v||"—"}</span></div>`).join("")}</div>
<div>${[["BMI",`${result.user_bmi} kg/m²`],["Category",cap(result.predicted_bmi_category)],["Condition",cap(result.disease)],["Diet",cap(result.diet_preference)]].map(([l,v])=>`<div class="prow"><span class="pl">${l}</span><span class="pv">${v||"—"}</span></div>`).join("")}</div>
</div>
<div class="bmi-badge"><div><span class="bmi-n">${result.user_bmi}</span><span style="font-size:12px;color:#718096"> kg/m²</span></div>
<div><div class="bmi-c">${(result.predicted_bmi_category||"").toUpperCase()}</div><div style="font-size:11px;color:#718096;margin-top:2px">✓ ML Verified</div></div></div></div>
<div class="sec"><div class="hdr green">Recommended Meal Plan — ${cap(result.meal_category)}</div>
<table class="mt"><thead><tr><th style="width:50%">Dish</th><th style="width:25%">Portion</th><th style="width:25%">Amount</th></tr></thead>
<tbody>${mealRows}<tr class="tr-total"><td>Total Meal Weight</td><td style="text-align:center">100%</td>
<td style="text-align:center"><span style="background:#22543d;color:#fff;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px">${tmg} g</span></td></tr></tbody></table>
<div class="cap">Gram values are BMI-adjusted via TDEE · Mifflin-St Jeor (${result.predicted_bmi_category}).</div></div>
<div class="sec"><div class="hdr gold">Nutrition Summary</div>
<div class="ng">${[{l:"Calories",v:result.totals.calories_kcal,u:"kcal",c:"#e53e3e"},{l:"Protein",v:result.totals.protein_g,u:"g",c:"#38a169"},{l:"Carbs",v:result.totals.carbs_g,u:"g",c:"#b7791f"},{l:"Fats",v:result.totals.fats_g,u:"g",c:"#744210"}].map(({l,v,u,c})=>`<div class="nb" style="border-color:${c};background:${c}11"><div class="nv" style="color:${c}">${v??'—'}</div><div class="nu">${u} · ${l}</div></div>`).join("")}</div>
${[{l:"Protein",v:result.totals.protein_g,u:"g",m:50,c:"#48bb78"},{l:"Carbs",v:result.totals.carbs_g,u:"g",m:200,c:"#b7791f"},{l:"Calories",v:result.totals.calories_kcal,u:"kcal",m:2500,c:"#e53e3e"},{l:"Fats",v:result.totals.fats_g,u:"g",m:70,c:"#744210"}].map(({l,v,u,m,c})=>`<div class="mr"><div class="mh"><span style="color:#718096">${l}</span><span style="font-weight:600">${v??'—'} ${u}</span></div><div class="mtr"><div class="mf" style="width:${Math.min(100,Math.round(((v??0)/m)*100))}%;background:${c}"></div></div></div>`).join("")}</div>
<div class="sec"><div class="hdr red">Foods to Avoid</div><div class="aw">${avoid.map(f=>`<span class="ap">${f}</span>`).join("")}</div></div>
<div class="sec"><div class="hdr green">Ayurvedic Taste Separation — Shad Rasa</div>
<p style="font-size:12px;color:#718096;margin-bottom:12px;font-style:italic">The six tastes and their presence in your personalised meal plan.</p>
<table class="rt"><tbody>${rasaRows}${unkRow}</tbody></table></div>
<div class="sec"><div class="hdr sage">Ayurvedic Wellness Tips</div>
${tips.map(t=>`<div class="tr"><div class="td"></div><div class="tt">${t}</div></div>`).join("")}</div>
</div><div class="foot">This report is for wellness guidance only. Consult a qualified Ayurvedic physician before making dietary changes.</div>
</div></body></html>`;
}

function SectionLabel({icon,children}:{icon:string;children:string}){
  return(<View style={s.sl}><Text style={s.sli}>{icon}</Text><Text style={s.slt}>{children}</Text></View>);
}
function CardShell({children,accent=T.leaf}:{children:React.ReactNode;accent?:string}){
  return(<View style={s.card}><View style={[s.cardBar,{backgroundColor:accent}]}/><View style={s.cardBody}>{children}</View></View>);
}
function SelectPill({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}){
  return(<View style={s.fg}><Text style={s.fl}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:6}}>
      <View style={s.pr}>{options.map(opt=>(
        <TouchableOpacity key={opt} onPress={()=>onChange(opt)} style={[s.pill,value===opt&&s.pillOn]}>
          <Text style={[s.pt,value===opt&&s.ptOn]}>{opt.charAt(0).toUpperCase()+opt.slice(1)}</Text>
        </TouchableOpacity>
      ))}</View>
    </ScrollView>
  </View>);
}
function InputField({label,value,onChange,keyboardType="default",placeholder=""}:{label:string;value:string;onChange:(v:string)=>void;keyboardType?:any;placeholder?:string}){
  return(<View style={s.fg}><Text style={s.fl}>{label}</Text>
    <TextInput style={s.inp} value={value} onChangeText={onChange} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor={T.inkLight}/>
  </View>);
}
function StepDots({current,total}:{current:number;total:number}){
  return(<View style={s.dots}>{Array.from({length:total}).map((_,i)=>(
    <View key={i} style={[s.dot,i<current?s.dDone:i===current?s.dActive:s.dIdle]}/>
  ))}</View>);
}
function GramPill({grams,dark}:{grams:number;dark?:boolean}){
  return(<View style={dark?s.gd:s.gl}><Text style={dark?s.gdt:s.glt}>{grams} g</Text></View>);
}
function PortionBar({pct}:{pct:number}){
  return(<View style={s.bt}><View style={[s.bf,{width:`${Math.min(100,pct)}%` as any}]}/></View>);
}

export default function DietScreen(){
  const [step,setStep]=useState(0);
  const [formData,setFormData]=useState<FormData>({age:"",gender:"",weight:"",height:"",disease:"",mealCategory:"",foodPreference:""});
  const [result,setResult]=useState<ResultData|null>(null);
  const [tasteMap,setTasteMap]=useState<Map<string,string>>(new Map());
  const [loading,setLoading]=useState(false);
  const [pdfLoading,setPdfLoading]=useState(false);
  const [pdfDone,setPdfDone]=useState(false);
  const [error,setError]=useState<string|null>(null);

  useEffect(()=>{
    (async()=>{
      try{
        const asset=Asset.fromModule(require("../../assets/images/ayurvedic_food_tastes.csv"));
        await asset.downloadAsync();
        const text=await FileSystem.readAsStringAsync(asset.localUri!);
        setTasteMap(parseCSV(text));
      }catch{setTasteMap(new Map());}
    })();
  },[]);

  const set=(key:keyof FormData)=>(val:string)=>{setFormData(f=>({...f,[key]:val}));setError(null);};

  const totalMealGrams=useMemo(()=>{
    if(!result)return 500;
    return calcGrams({age:parseFloat(formData.age)||25,gender:formData.gender||"female",weight_kg:parseFloat(formData.weight)||60,height_cm:parseFloat(formData.height)||165,bmiCategory:result.predicted_bmi_category||"normal",mealCategory:result.meal_category||"lunch",mealCalories:result.totals?.calories_kcal||500});
  },[result,formData]);

  const rasaGrouped:RasaGrouped=useMemo(()=>{
    const g:RasaGrouped={sweet:[],sour:[],salty:[],pungent:[],bitter:[],astringent:[],unknown:[]};
    if(!result?.meal_plan)return g;
    result.meal_plan.forEach(item=>{const k=tasteMap.get(norm(item.dish));(g[(!tasteMap.size||!k)?"unknown":k]=g[(!tasteMap.size||!k)?"unknown":k]||[]).push(item);});
    return g;
  },[tasteMap,result]);

  const stepValid=[
    ()=>!!formData.age&&!!formData.gender&&!!formData.weight&&!!formData.height,
    ()=>!!formData.disease,
    ()=>!!formData.mealCategory&&!!formData.foodPreference,
    ()=>true,
  ];

  const handleGenerate=useCallback(async()=>{
    setLoading(true);setError(null);
    try{
      const payload={age:parseInt(formData.age),gender:formData.gender.toLowerCase(),weight_kg:parseFloat(formData.weight),height_cm:parseFloat(formData.height),disease:formData.disease.toLowerCase(),meal_category:formData.mealCategory.toLowerCase(),diet_preference:formData.foodPreference.toLowerCase()};
      const response=await fetch("http://172.20.10.3:5001/predict_diet",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json();
      if(data.success){
        setResult({user_bmi:data.user_info.bmi,predicted_bmi_category:data.user_info.bmi_category,meal_category:data.meal_info.meal_category,diet_preference:data.meal_info.diet_preference,disease:data.meal_info.disease,foods_to_avoid:data.foods_to_avoid,
          meal_plan:data.meal_plan.map((d:any)=>({dish:cleanDishName(d.dish),portion_pct:d.portion_percent})),
          totals:{calories_kcal:data.nutrition.total_calories_kcal,protein_g:data.nutrition.protein_g,carbs_g:data.nutrition.carbs_g,fats_g:data.nutrition.fats_g}});
        setStep(4);
      }else{setError(data.error||"Failed to generate meal plan.");}
    }catch{setError("Could not connect to the diet service. Make sure Flask API is running.");}
    finally{setLoading(false);}
  },[formData]);

  const handleNext=()=>{if(!stepValid[step]()){setError("Please fill all required fields.");return;}setError(null);if(step===3){handleGenerate();return;}setStep(n=>n+1);};
  const handleBack=()=>{setError(null);if(step===4){setStep(3);setResult(null);return;}setStep(n=>Math.max(n-1,0));};
  const handleReset=()=>{setFormData({age:"",gender:"",weight:"",height:"",disease:"",mealCategory:"",foodPreference:""});setResult(null);setError(null);setStep(0);setPdfDone(false);};

  const handleDownloadPDF=useCallback(async()=>{
    if(!result)return;
    setPdfLoading(true);setPdfDone(false);
    try{
      const html=buildPDF(result,formData,rasaGrouped,totalMealGrams);
      const{uri}=await Print.printToFileAsync({html,base64:false});
      const dest=`${FileSystem.documentDirectory}AyurvedicDietPlan_${formData.gender||"user"}_${Date.now()}.pdf`;
      await FileSystem.moveAsync({from:uri,to:dest});
      if(await Sharing.isAvailableAsync()){
        await Sharing.shareAsync(dest,{mimeType:"application/pdf",dialogTitle:"Save / Share Diet Plan"});
        setPdfDone(true);setTimeout(()=>setPdfDone(false),4000);
      }else{Alert.alert("Saved",`PDF saved to:\n${dest}`);setPdfDone(true);}
    }catch{Alert.alert("Error","Could not generate PDF. Please try again.");}
    finally{setPdfLoading(false);}
  },[result,formData,rasaGrouped,totalMealGrams]);

  const bc=(result?.predicted_bmi_category||"").toLowerCase();
  const bmiColor=bc==="normal"?T.sage:bc==="underweight"?"#d69e2e":bc==="overweight"?"#ed8936":T.errorRed;

  return(
    <ScrollView style={s.screen} contentContainerStyle={s.sc}>
      <View style={s.hdr2}>
        <View style={s.hring}><Ionicons name="restaurant" size={40} color={T.leaf}/></View>
        <Text style={s.ht}>Ayurvedic Meal Planner</Text>
        <Text style={s.hs}>AI-assisted dietary guidance based on Ayurvedic principles</Text>
      </View>

      {error&&(<View style={s.eb}><Ionicons name="alert-circle" size={15} color={T.errorRed}/><Text style={s.et}>{error}</Text></View>)}

      {step===0&&(<CardShell>
        <SectionLabel icon="🧍">Personal & Measurements</SectionLabel>
        <InputField label="Age (years)" value={formData.age} onChange={set("age")} keyboardType="numeric" placeholder="e.g. 28"/>
        <SelectPill label="Gender" value={formData.gender} options={GENDERS} onChange={set("gender")}/>
        <InputField label="Weight (kg)" value={formData.weight} onChange={set("weight")} keyboardType="decimal-pad" placeholder="e.g. 65"/>
        <InputField label="Height (cm)" value={formData.height} onChange={set("height")} keyboardType="decimal-pad" placeholder="e.g. 170"/>
        <Text style={s.hint}>BMI is calculated and verified by the ML model after generating your plan.</Text>
      </CardShell>)}

      {step===1&&(<CardShell>
        <SectionLabel icon="🩺">Health Information</SectionLabel>
        <SelectPill label="Health Condition" value={formData.disease} options={DISEASES} onChange={set("disease")}/>
        <View style={s.ib}><Ionicons name="information-circle-outline" size={16} color="#2b6cb0"/><Text style={s.it}>Foods to avoid will be generated based on your condition.</Text></View>
      </CardShell>)}

      {step===2&&(<CardShell accent={T.gold}>
        <SectionLabel icon="🍽️">Meal Preferences</SectionLabel>
        <SelectPill label="Meal Category" value={formData.mealCategory} options={MEALS} onChange={set("mealCategory")}/>
        <SelectPill label="Food Preference" value={formData.foodPreference} options={PREFS} onChange={set("foodPreference")}/>
        <View style={[s.ib,{backgroundColor:"#f0fff4",borderColor:T.borderGreen}]}><Ionicons name="checkmark-circle-outline" size={16} color={T.leaf}/><Text style={[s.it,{color:T.leafMid}]}>Output: Full meal + Portions + BMI-adjusted grams + Shad Rasa</Text></View>
      </CardShell>)}

      {step===3&&(<View style={s.card}><View style={[s.cardBar,{backgroundColor:T.leaf}]}/><View style={s.cardBody}>
        <View style={s.rh}><View style={s.rl}/><Text style={s.rt2}>Review Your Inputs</Text><View style={s.sb}><Text style={s.sbt}>Step 4 of 4</Text></View></View>
        <View style={s.rp}><View style={s.rph}><Ionicons name="person" size={13} color={T.leaf}/><Text style={s.rpt}>PERSONAL</Text></View>
        {[["Age",`${formData.age} yrs`],["Gender",formData.gender],["Weight",`${formData.weight} kg`],["Height",`${formData.height} cm`]].map(([l,v])=>(
          <View key={l} style={s.rrow}><Text style={s.rl2}>{l}</Text><Text style={s.rv}>{v||"—"}</Text></View>))}
        </View>
        <View style={[s.rp,{marginTop:10}]}><View style={s.rph}><Ionicons name="medkit" size={13} color={T.leaf}/><Text style={s.rpt}>HEALTH & MEAL</Text></View>
        {[["Condition",formData.disease],["Meal",formData.mealCategory],["Preference",formData.foodPreference==="veg"?"🌿 Vegetarian":"🍗 Non-Vegetarian"]].map(([l,v])=>(
          <View key={l} style={s.rrow}><Text style={s.rl2}>{l}</Text><Text style={s.rv}>{v||"—"}</Text></View>))}
        </View>
        <View style={s.rf}><View style={s.rfd}/><Text style={s.rft}>Your Ayurvedic meal plan will be generated based on these inputs.</Text></View>
      </View></View>)}

      {step===4&&result&&(<View>
        <View style={s.resH}><View style={s.resB}/><Text style={s.resT}>🌿 Personalized Results</Text></View>

        <CardShell accent={bmiColor}>
          <SectionLabel icon="📊">BMI Analysis</SectionLabel>
          <View style={s.bmiRow}><Text style={[s.bmiN,{color:bmiColor}]}>{result.user_bmi}</Text><Text style={s.bmiU}>kg/m²</Text></View>
          <View style={[s.bmiB,{borderColor:bmiColor}]}><View style={[s.d8,{backgroundColor:bmiColor}]}/><Text style={[s.bmiC,{color:bmiColor}]}>{(result.predicted_bmi_category||"").toUpperCase()}</Text></View>
          <View style={s.ml}><View style={[s.d8,{backgroundColor:T.sage}]}/><Text style={s.mlt}>Verified by ML classification model</Text></View>
        </CardShell>

        <CardShell accent={T.errorRed}>
          <SectionLabel icon="🚫">Foods to Avoid</SectionLabel>
          <View style={s.aw}>{(result.foods_to_avoid?String(result.foods_to_avoid).split(","):[]).map((f,i)=>(
            <View key={i} style={s.ap}><Text style={s.apt}>{f.trim()}</Text></View>))}</View>
        </CardShell>

        <CardShell>
          <SectionLabel icon="🍽️">Recommended Meal Plan</SectionLabel>
          <View style={s.th}><Text style={[s.tht,{flex:2}]}>Dish</Text><Text style={[s.tht,{flex:1}]}>Portion %</Text><Text style={[s.tht,{flex:1}]}>Amount</Text></View>
          {result.meal_plan.map((item,i)=>{const g=ptg(item.portion_pct,totalMealGrams);return(
            <View key={i} style={[s.tr2,i%2===0?s.re:s.ro]}>
              <View style={{flex:2,flexDirection:"row",alignItems:"center",gap:6}}><View style={s.d6}/><Text style={s.dt}>{item.dish}</Text></View>
              <View style={{flex:1}}><Text style={s.pct}>{item.portion_pct}%</Text><PortionBar pct={item.portion_pct}/></View>
              <View style={{flex:1}}><GramPill grams={g}/></View>
            </View>);})}
          <View style={s.totr}><Text style={[s.tott,{flex:2}]}>Total</Text><Text style={[s.tott,{flex:1}]}>100%</Text><View style={{flex:1}}><GramPill grams={totalMealGrams} dark/></View></View>
          <Text style={s.cap}>Gram values are BMI-adjusted via TDEE · Mifflin-St Jeor ({result.predicted_bmi_category}).</Text>
        </CardShell>

        <CardShell accent={T.gold}>
          <SectionLabel icon="🧪">Nutrient Summary</SectionLabel>
          {[{label:"Calories",value:result.totals.calories_kcal,unit:"kcal",color:"#e53e3e"},{label:"Protein",value:result.totals.protein_g,unit:"g",color:T.sage},{label:"Carbs",value:result.totals.carbs_g,unit:"g",color:T.gold},{label:"Fats",value:result.totals.fats_g,unit:"g",color:T.bark}].map(({label,value,unit,color})=>(
            <View key={label} style={s.nr}><View style={s.nl}><View style={[s.d8,{backgroundColor:color}]}/><Text style={s.nla}>{label}</Text></View><View style={s.nri}><Text style={s.nv}>{value??'—'}</Text><Text style={s.nu}> {unit}</Text></View></View>))}
          <View style={s.div}/><Text style={s.mtt}>Daily Macro Progress</Text>
          {[{label:"Protein",value:result.totals.protein_g,unit:"g",max:50,color:T.sage},{label:"Carbs",value:result.totals.carbs_g,unit:"g",max:200,color:T.gold},{label:"Calories",value:result.totals.calories_kcal,unit:"kcal",max:2500,color:"#e53e3e"},{label:"Fats",value:result.totals.fats_g,unit:"g",max:70,color:T.bark}].map(({label,value,unit,max,color})=>(
            <View key={label} style={s.mar}><View style={s.mat}><Text style={s.mal}>{label}</Text><Text style={s.mav}>{value??'—'} {unit}</Text></View><View style={s.mtr}><View style={[s.mf,{width:`${Math.min(100,Math.round(((value??0)/max)*100))}%` as any,backgroundColor:color}]}/></View></View>))}
        </CardShell>

        <CardShell>
          <SectionLabel icon="🌸">Ayurvedic Taste Separation — Shad Rasa</SectionLabel>
          <Text style={s.rs}>The six tastes and their presence in your personalized meal plan.</Text>
          <View style={s.th}><Text style={[s.tht,{flex:1.5}]}>Taste</Text><Text style={[s.tht,{flex:2}]}>Dish</Text><Text style={[s.tht,{flex:1}]}>%</Text><Text style={[s.tht,{flex:1}]}>Amt</Text></View>
          {[...ALL_RASAS,"unknown"].flatMap(rasa=>{
            const items=rasaGrouped[rasa]??[];
            const label=rasa==="unknown"?"Not Defined":RASA_LABEL[rasa];
            const col=rasa==="unknown"?"#d69e2e":RASA_COLOR[rasa];
            if(items.length===0)return[{label,col,item:null as MealItem|null}];
            return items.map(item=>({label,col,item}));
          }).map(({label,col,item},i)=>{
            const g=item?ptg(item.portion_pct,totalMealGrams):null;
            return(<View key={i} style={[s.tr2,i%2===0?s.re:s.ro]}>
              <View style={{flex:1.5,flexDirection:"row",alignItems:"center",gap:5}}><View style={[s.d6,{backgroundColor:col}]}/><Text style={[s.dt,{color:col,fontWeight:"700",fontSize:11}]} numberOfLines={2}>{label}</Text></View>
              <View style={{flex:2}}>{item?<Text style={s.dt} numberOfLines={2}>{item.dish}</Text>:<Text style={s.nm}>No dishes matched</Text>}</View>
              <View style={{flex:1}}>{item&&<><Text style={s.pct}>{item.portion_pct}%</Text><PortionBar pct={item.portion_pct}/></>}</View>
              <View style={{flex:1}}>{item&&g!==null&&<GramPill grams={g}/>}</View>
            </View>);
          })}
        </CardShell>

        <TouchableOpacity style={[s.pdfBtn,pdfLoading&&s.bDis]} onPress={handleDownloadPDF} disabled={pdfLoading}>
          {pdfLoading?<ActivityIndicator size="small" color={T.white}/>:
           pdfDone?(<><Ionicons name="checkmark-circle" size={18} color={T.white}/><Text style={s.pdfT}>PDF Ready!</Text></>):
           (<><Ionicons name="download" size={18} color={T.white}/><Text style={s.pdfT}>Download Diet Plan PDF</Text></>)}
        </TouchableOpacity>

        <View style={s.auth}><Ionicons name="person-circle" size={34} color={T.leafMid}/>
          <View style={{flex:1}}><Text style={s.an}>Dias W A N M</Text><Text style={s.ai}>IT22899910</Text><Text style={s.am}>Ayurvedic Dietary Recommendation Module</Text></View>
        </View>
      </View>)}

      {step<4&&<StepDots current={step} total={4}/>}

      <View style={s.nav}>
        {step>0&&(<TouchableOpacity style={s.bOut} onPress={handleBack}><Ionicons name="arrow-back" size={16} color={T.leaf}/><Text style={s.bOutT}>Back</Text></TouchableOpacity>)}
        {step<4&&(<TouchableOpacity style={[s.bPri,loading&&s.bDis]} onPress={handleNext} disabled={loading}>
          {loading?<ActivityIndicator size="small" color={T.white}/>:(<><Text style={s.bPriT}>{step===3?"Generate Plan":"Next"}</Text><Ionicons name={step===3?"sparkles":"arrow-forward"} size={16} color={T.white}/></>)}
        </TouchableOpacity>)}
        {step===4&&(<TouchableOpacity style={s.bOut} onPress={handleReset}><Ionicons name="refresh" size={16} color={T.leaf}/><Text style={s.bOutT}>Start Over</Text></TouchableOpacity>)}
      </View>

      <Text style={s.disc}>For wellness guidance only. Consult a qualified Ayurvedic physician before making dietary changes.</Text>
    </ScrollView>
  );
}

const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:T.bg},sc:{padding:16,paddingBottom:48},
  hdr2:{alignItems:"center",marginBottom:20},hring:{width:80,height:80,borderRadius:40,backgroundColor:"#e8f5e9",alignItems:"center",justifyContent:"center",marginBottom:12,borderWidth:2,borderColor:T.borderGreen},
  ht:{fontSize:22,fontWeight:"800",color:T.leaf,textAlign:"center",letterSpacing:-0.3},hs:{fontSize:13,color:T.inkLight,textAlign:"center",marginTop:4,lineHeight:18},
  eb:{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:T.redPale,borderWidth:1,borderColor:T.redSoft,borderRadius:10,padding:10,marginBottom:12},et:{flex:1,fontSize:13,color:T.errorRed},
  card:{backgroundColor:T.white,borderRadius:16,borderWidth:1,borderColor:T.borderGreen,marginBottom:14,overflow:"hidden",...Platform.select({ios:{shadowColor:"#000",shadowOffset:{width:0,height:2},shadowOpacity:0.07,shadowRadius:8},android:{elevation:3}})},
  cardBar:{height:5},cardBody:{padding:16},
  sl:{flexDirection:"row",alignItems:"center",gap:6,marginBottom:14},sli:{fontSize:14},slt:{fontSize:11,fontWeight:"700",color:T.leafMid,textTransform:"uppercase",letterSpacing:1.2},
  fg:{marginBottom:14},fl:{fontSize:12,fontWeight:"600",color:T.inkMid,marginBottom:4},hint:{fontSize:11,color:T.inkLight,marginTop:6,lineHeight:16},
  inp:{borderWidth:1,borderColor:T.border,borderRadius:10,paddingHorizontal:12,paddingVertical:10,fontSize:14,color:T.inkDark,backgroundColor:T.parchment},
  pr:{flexDirection:"row",gap:8},pill:{paddingHorizontal:14,paddingVertical:7,borderRadius:99,borderWidth:1.5,borderColor:T.border,backgroundColor:T.white},pillOn:{borderColor:T.leaf,backgroundColor:T.sagePale},
  pt:{fontSize:13,color:T.inkLight,fontWeight:"500"},ptOn:{color:T.leaf,fontWeight:"700"},
  ib:{flexDirection:"row",alignItems:"center",gap:8,backgroundColor:"#ebf8ff",borderWidth:1,borderColor:"#63b3ed",borderRadius:10,padding:10,marginTop:10},it:{flex:1,fontSize:12,color:"#2b6cb0",lineHeight:17},
  dots:{flexDirection:"row",justifyContent:"center",gap:6,marginVertical:16},dot:{width:8,height:8,borderRadius:4},dDone:{backgroundColor:T.sage},dActive:{backgroundColor:T.leaf,width:22,borderRadius:4},dIdle:{backgroundColor:T.border},
  rh:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:14},rl:{width:4,height:22,borderRadius:2,backgroundColor:T.leaf},rt2:{fontSize:15,fontWeight:"700",color:T.inkDark,flex:1},
  sb:{paddingHorizontal:10,paddingVertical:3,borderRadius:99,backgroundColor:T.sagePale,borderWidth:1,borderColor:T.borderGreen},sbt:{fontSize:10,fontWeight:"700",color:T.leaf,letterSpacing:0.5},
  rp:{borderRadius:12,borderWidth:1,borderColor:T.borderGreen,overflow:"hidden"},rph:{flexDirection:"row",alignItems:"center",gap:6,paddingHorizontal:12,paddingVertical:8,backgroundColor:T.sagePale,borderBottomWidth:1,borderBottomColor:T.borderGreen},
  rpt:{fontSize:10,fontWeight:"700",color:T.leafMid,letterSpacing:1.2},rrow:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingHorizontal:12,paddingVertical:9,borderBottomWidth:1,borderBottomColor:T.border},
  rl2:{fontSize:13,color:T.inkLight},rv:{fontSize:13,fontWeight:"600",color:T.inkDark},rf:{flexDirection:"row",alignItems:"center",gap:8,marginTop:14},rfd:{width:6,height:6,borderRadius:3,backgroundColor:T.sage},rft:{fontSize:12,color:T.inkLight,flex:1,lineHeight:17},
  resH:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:14},resB:{width:4,height:28,borderRadius:2,backgroundColor:T.leaf},resT:{fontSize:20,fontWeight:"800",color:T.inkDark},
  bmiRow:{flexDirection:"row",alignItems:"flex-end",gap:6,marginBottom:10},bmiN:{fontSize:44,fontWeight:"800",lineHeight:48},bmiU:{fontSize:14,color:T.inkLight,marginBottom:6},
  bmiB:{flexDirection:"row",alignItems:"center",gap:6,alignSelf:"flex-start",paddingHorizontal:12,paddingVertical:5,borderRadius:99,borderWidth:1.5,backgroundColor:T.white,marginBottom:10},bmiC:{fontSize:12,fontWeight:"700",letterSpacing:0.8},
  ml:{flexDirection:"row",alignItems:"center",gap:6},mlt:{fontSize:12,color:T.inkLight},d8:{width:8,height:8,borderRadius:4},
  aw:{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:4},ap:{paddingHorizontal:12,paddingVertical:5,borderRadius:99,backgroundColor:T.redPale,borderWidth:1,borderColor:T.redSoft},apt:{fontSize:12,fontWeight:"500",color:T.errorRed},
  th:{flexDirection:"row",backgroundColor:T.sagePale,paddingHorizontal:10,paddingVertical:8,borderRadius:8,marginBottom:2},tht:{fontSize:10,fontWeight:"700",color:T.leafMid,textTransform:"uppercase",letterSpacing:0.8},
  tr2:{flexDirection:"row",alignItems:"center",paddingHorizontal:10,paddingVertical:10,borderBottomWidth:1,borderBottomColor:T.border},re:{backgroundColor:"#f8fffe"},ro:{backgroundColor:T.white},
  d6:{width:6,height:6,borderRadius:3,backgroundColor:T.sage,flexShrink:0},dt:{fontSize:13,color:T.inkDark,fontWeight:"500",flexShrink:1},nm:{fontSize:12,color:T.inkLight,fontStyle:"italic"},
  pct:{fontSize:12,fontWeight:"700",color:T.leaf,marginBottom:3},bt:{height:4,borderRadius:99,backgroundColor:T.border,overflow:"hidden",width:"80%"},bf:{height:"100%",borderRadius:99,backgroundColor:T.sage},
  gl:{paddingHorizontal:8,paddingVertical:3,borderRadius:99,backgroundColor:T.sagePale,borderWidth:1,borderColor:T.borderGreen,alignSelf:"flex-start"},glt:{fontSize:11,fontWeight:"700",color:T.leaf},
  gd:{paddingHorizontal:8,paddingVertical:3,borderRadius:99,backgroundColor:T.leaf,alignSelf:"flex-start"},gdt:{fontSize:11,fontWeight:"700",color:T.white},
  totr:{flexDirection:"row",alignItems:"center",paddingHorizontal:10,paddingVertical:9,backgroundColor:T.sagePale,borderRadius:8,marginTop:4},tott:{fontSize:12,fontWeight:"700",color:T.leaf},
  cap:{fontSize:11,color:T.inkLight,marginTop:8,lineHeight:16},
  nr:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:9,borderBottomWidth:1,borderBottomColor:T.border},nl:{flexDirection:"row",alignItems:"center",gap:8},nla:{fontSize:13,color:T.inkMid,fontWeight:"500"},
  nri:{flexDirection:"row",alignItems:"baseline"},nv:{fontSize:16,fontWeight:"700",color:T.inkDark},nu:{fontSize:11,color:T.inkLight},
  div:{height:1,backgroundColor:T.border,marginVertical:14},mtt:{fontSize:10,fontWeight:"700",color:T.inkLight,textTransform:"uppercase",letterSpacing:1,marginBottom:10},
  mar:{marginBottom:10},mat:{flexDirection:"row",justifyContent:"space-between",marginBottom:4},mal:{fontSize:12,color:T.inkLight,fontWeight:"500"},mav:{fontSize:12,color:T.inkMid,fontWeight:"600"},
  mtr:{height:6,borderRadius:99,backgroundColor:T.border,overflow:"hidden"},mf:{height:"100%",borderRadius:99},
  rs:{fontSize:12,color:T.inkLight,marginBottom:10,lineHeight:17},
  pdfBtn:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10,backgroundColor:T.leaf,borderRadius:14,paddingVertical:15,marginBottom:14,...Platform.select({ios:{shadowColor:T.leaf,shadowOffset:{width:0,height:4},shadowOpacity:0.3,shadowRadius:10},android:{elevation:5}})},
  pdfT:{fontSize:16,fontWeight:"700",color:T.white},
  auth:{flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"#e8f5e9",borderRadius:14,padding:14,borderLeftWidth:4,borderLeftColor:T.leaf,marginBottom:14},
  an:{fontSize:14,fontWeight:"700",color:T.leaf},ai:{fontSize:11,color:T.inkLight},am:{fontSize:12,color:T.leafMid,marginTop:2},
  nav:{flexDirection:"row",justifyContent:"center",gap:12,marginTop:8,marginBottom:6},
  bPri:{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,backgroundColor:T.leaf,borderRadius:12,paddingVertical:14},bDis:{opacity:0.6},bPriT:{fontSize:15,fontWeight:"700",color:T.white},
  bOut:{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,borderWidth:1.5,borderColor:T.leaf,borderRadius:12,paddingVertical:14},bOutT:{fontSize:15,fontWeight:"600",color:T.leaf},
  disc:{fontSize:11,color:T.inkLight,textAlign:"center",lineHeight:16,marginTop:8},
});