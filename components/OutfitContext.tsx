"use client";
import {createContext,useContext,useEffect,useState,ReactNode} from 'react';
export const outfits=[
 {id:'original',name:'阿绒原装',src:'/images/arong-walk-pixel.png'},
 {id:'autumn',name:'秋日蓝开衫',src:'/images/outfit-autumn.png'},
 {id:'pastry',name:'糕点师',src:'/images/outfit-pastry.png'},
 {id:'winter',name:'冬日围巾',src:'/images/outfit-winter.png'},
 {id:'chef',name:'小小主厨',src:'/images/outfit-chef.png'},
 {id:'home',name:'居家紫开衫',src:'/images/outfit-home.png'},
];
const Context=createContext({outfit:'original',setOutfit:(_value:string)=>{}});
export const useOutfit=()=>useContext(Context);
/** 外观属于主控角色，全场景共享；离开商店不会丢失。 */
export function OutfitProvider({children}:{children:ReactNode}){
 const [outfit,setValue]=useState('original');
 useEffect(()=>{try{const saved=localStorage.getItem('arong-outfit-v1');if(outfits.some(o=>o.id===saved))setValue(saved!);}catch{}},[]);
 const setOutfit=(value:string)=>{if(!outfits.some(o=>o.id===value))return;setValue(value);try{localStorage.setItem('arong-outfit-v1',value);}catch{}};
 return <Context.Provider value={{outfit,setOutfit}}>{children}</Context.Provider>;
}
