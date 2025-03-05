"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import clientData from "@/data/client-info.json"

export default function ClientInfo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full border border-border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 bg-secondary cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">{clientData.client}</h2>
          <span className="text-sm text-muted-foreground">Budget: {clientData.budget}</span>
        </div>
        <button className="p-1">{isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Infrastructure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(clientData.infrastructure.servers).map(([name, details]) => (
                <div key={name} className="border border-border rounded-md p-3">
                  <h4 className="font-medium">{name}</h4>
                  <p className="text-sm text-muted-foreground">Location: {details.location}</p>
                  <p className="text-sm text-muted-foreground">Purpose: {details.purpose}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Other Systems</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-border rounded-md p-3">
                <h4 className="font-medium">Virtual Learning Platform</h4>
                <p className="text-sm text-muted-foreground">Name: {clientData.virtual_learning_platform.name}</p>
                <p className="text-sm text-muted-foreground">Purpose: {clientData.virtual_learning_platform.purpose}</p>
              </div>
              <div className="border border-border rounded-md p-3">
                <h4 className="font-medium">Operating System</h4>
                <p className="text-sm text-muted-foreground">{clientData.operating_system.computers}</p>
              </div>
              <div className="border border-border rounded-md p-3">
                <h4 className="font-medium">Remote Access</h4>
                <p className="text-sm text-muted-foreground">VPN: {clientData.remote_access.vpn}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" size={20} />
              Security Risks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clientData.security_risks.map((risk, index) => (
                <div key={index} className="border border-yellow-200 bg-yellow-50 rounded-md p-3">
                  <h4 className="font-medium text-yellow-800">{risk.issue}</h4>
                  <p className="text-sm text-yellow-700">{risk.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

