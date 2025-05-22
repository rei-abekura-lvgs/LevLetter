"use client"

import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn, getInitials } from "@/lib/utils"

export interface BearAvatarProps {
  name: string;
  color?: string;
  className?: string;
}

export function BearAvatar({ name, color = "primary-500", className }: BearAvatarProps) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarFallback className="bg-[#046EB8] text-white">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}