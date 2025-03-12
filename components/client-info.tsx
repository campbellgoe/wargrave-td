"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, AlertTriangle, ShieldCheck, Lock } from "lucide-react"

export default function SecurityPresentation() {
  const [isOpen, setIsOpen] = useState(false)
  const [riskOpen, setRiskOpen] = useState(false)
  const [countermeasuresOpen, setCountermeasuresOpen] = useState(false)

  return (
    <div className="w-full border border-border rounded-lg overflow-hidden bg-white shadow-md">
      <div
        className="flex items-center justify-between p-4 bg-blue-600 text-white cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h2 className="text-xl font-semibold">Wargrave Tower Defence: Gamified Learning for Cyber Security</h2>
        <button className="p-1">{isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
      </div>

      {isOpen && (
        <div className="p-4 space-y-6">
          {/* Security Risks */}
          <section>
            <div
              className="flex items-center justify-between cursor-pointer bg-yellow-100 p-3 rounded-md"
              onClick={() => setRiskOpen(!riskOpen)}
            >
              <h3 className="text-lg font-medium flex items-center gap-2">
                <AlertTriangle className="text-yellow-600" size={20} />
                Identified Security Risks
              </h3>
              {riskOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {riskOpen && (
              <div className="p-4 space-y-4 border border-yellow-300 rounded-md bg-yellow-50">
                <p>Key security risks identified at Wargrave College:</p>
                <ul className="list-disc list-inside">
                  <li><strong>Unauthorized Access:</strong> Weak authentication methods allow unauthorized access to sensitive data.</li>
                  <li><strong>Malware & Viruses:</strong> Lack of robust endpoint security can lead to infection.</li>
                  <li><strong>DDoS Attacks:</strong> Disruptions caused by network overload due to malicious traffic.</li>
                  <li><strong>Incorrect Firewall Configurations:</strong> Misconfigured firewall policies can expose internal systems.</li>
                  <li><strong>Weak VPN Security:</strong> Third-party VPN clients may introduce security vulnerabilities.</li>
                  <li><strong>Insufficient Network Monitoring:</strong> Lack of monitoring tools increases the risk of undetected attacks.</li>
                </ul>
              </div>
            )}
          </section>

          {/* Countermeasures */}
          <section>
            <div
              className="flex items-center justify-between cursor-pointer bg-green-100 p-3 rounded-md"
              onClick={() => setCountermeasuresOpen(!countermeasuresOpen)}
            >
              <h3 className="text-lg font-medium flex items-center gap-2">
                <ShieldCheck className="text-green-600" size={20} />
                Recommended Security Countermeasures
              </h3>
              {countermeasuresOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {countermeasuresOpen && (
              <div className="p-4 space-y-4 border border-green-300 rounded-md bg-green-50">
                <p>To mitigate these risks, Wargrave College should implement the following measures:</p>
                <ul className="list-disc list-inside">
                  <li>
                    <strong>ISO 27001 Compliance:</strong> Implement an Information Security Management System (ISMS) to protect confidentiality, integrity, and availability of information.
                  </li>
                  <li>
                    <strong>Network Monitoring:</strong> Deploy Intrusion Detection/Prevention Systems (IDS/IPS) to detect and respond to threats in real time.
                  </li>
                  <li>
                    <strong>Firewall Best Practices:</strong> Ensure firewalls are configured to block unauthorized traffic while allowing essential communications.
                  </li>
                  <li>
                    <strong>Secure VPN:</strong> Use open-source VPN solutions like OpenVPN with strong authentication protocols.
                  </li>
                  <li>
                    <strong>De-Militarized Zone (DMZ):</strong> Segment public-facing services from internal systems to reduce attack surface.
                  </li>
                  <li>
                    <strong>Static IP & NAT:</strong> Improve control over inbound/outbound traffic by using Static IPs and Network Address Translation (NAT).
                  </li>
                  <li>
                    <strong>Data Encryption:</strong> Encrypt sensitive data at rest and in transit to prevent unauthorized access.
                  </li>
                  <li>
                    <strong>Security Awareness Training:</strong> Educate staff and students on security best practices and phishing attack prevention.
                  </li>
                  <li>
                    <strong>Access Control:</strong> Implement strong authentication mechanisms such as multi-factor authentication (MFA) and role-based access control (RBAC).
                  </li>
                </ul>
              </div>
            )}
          </section>

          {/* Risk Assessment */}
          <section>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Lock className="text-gray-600" size={20} />
              Risk Assessment Methodology
            </h3>
            <p>
              A structured risk assessment process should be adopted to evaluate vulnerabilities and prioritize
              countermeasures. The following framework is suggested:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                <h4 className="font-medium">1. Identify Risks</h4>
                <p className="text-sm">Assess potential threats to assets, systems, and data.</p>
              </div>
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                <h4 className="font-medium">2. Assess Impact</h4>
                <p className="text-sm">Determine the probability and severity of security incidents.</p>
              </div>
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
                <h4 className="font-medium">3. Implement Controls</h4>
                <p className="text-sm">Apply security countermeasures to mitigate identified risks.</p>
              </div>
            </div>
          </section>

          {/* Conclusion */}
          <section>
            <h3 className="text-lg font-medium">Conclusion</h3>
            <p>
              To strengthen Wargrave College{"'"}s cyber security, a multi-layered approach must be implemented,
              including proactive monitoring, strict access controls, and continuous staff training.
            </p>
            <p>
              Adopting an ISMS and working towards ISO 27001 compliance will provide a structured security
              framework ensuring data protection and operational integrity.
            </p>
          </section>
        </div>
      )}
    </div>
  )
}