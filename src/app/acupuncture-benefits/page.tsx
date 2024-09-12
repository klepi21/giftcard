import { Brain, Calendar, Heart, Stethoscope, Sparkles, Zap } from "lucide-react"

export default function Component() {
  const benefits = [
    { icon: Brain, text: "Πονοκέφαλοι" },
    { icon: Calendar, text: "Περίοδος" },
    { icon: Heart, text: "Ανακούφιση από το Στρες" },
    { icon: Zap, text: "Πνευματική Διαύγεια" },
    { icon: Stethoscope, text: "Αναπνευστικά Προβλήματα" },
    { icon: Sparkles, text: "Γενική Ευεξία" }
  ]

  return (
    <div className="w-full max-w-md mx-auto mt-8 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-center mb-6 text-gray-800">Ο Βελονισμός βοηθάει σε...</h2>
      <div className="grid grid-cols-3 gap-4">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex flex-col items-center justify-center p-4 bg-[#f3e8d8] rounded-lg">
            <benefit.icon className="w-8 h-8 mb-2 text-gray-700" />
            <span className="text-sm text-center text-gray-700">{benefit.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}