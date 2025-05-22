"use client"

import * as React from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { BearLogo } from "@/components/bear-logo"

export interface BearAvatarProps {
  name: string;
  color?: string;
  className?: string;
}

export function BearAvatar({ name, color = "primary-500", className }: BearAvatarProps) {
  return (
    <Avatar className={cn("h-8 w-8", className)}>
      <AvatarFallback className="p-0 border-0">
        <BearLogo size={32} useTransparent={true} bgColor="bg-[#3990EA]" />
      </AvatarFallback>
    </Avatar>
  )
}