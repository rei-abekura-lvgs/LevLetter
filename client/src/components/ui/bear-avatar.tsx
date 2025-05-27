"use client"

import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import whiteBearIcon from "@assets/ChatGPT Image 2025年5月22日 20_52_25_1748333385657.png"

export interface BearAvatarProps {
  name: string;
  color?: string;
  className?: string;
}

export function BearAvatar({ name, color = "primary-500", className }: BearAvatarProps) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarFallback className="p-0 border-0 bg-[#3990EA] flex items-center justify-center">
        <img 
          src={whiteBearIcon} 
          alt="Bear Avatar" 
          className="w-6 h-6 object-contain"
        />
      </AvatarFallback>
    </Avatar>
  )
}