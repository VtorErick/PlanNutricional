import { motion } from 'framer-motion';
import { Heart, Target, Clock, BarChart3 } from 'lucide-react';
import type { Profile } from '../data';

interface ProfileCardProps {
  perfil: Profile;
}

export default function ProfileCard({ perfil }: ProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-900 to-sky-800"
    >
      {/* Grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-grid-pattern" />
      </div>

      {/* Decorative blobs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-sky-400/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl" />

      <div className="relative p-8 md:p-10 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-400" />
            <h2 className="text-3xl md:text-4xl font-bold text-white">{perfil.nombre}</h2>
          </div>
          <p className="text-sky-200 text-lg leading-relaxed max-w-2xl">
            {perfil.descripcion}
          </p>
        </div>

        {/* Grid de info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Perfil */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <p className="text-xs text-sky-200 font-medium uppercase tracking-wider mb-1">
              Perfil
            </p>
            <p className="text-white font-bold text-sm">{perfil.perfil}</p>
          </div>

          {/* Meta */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center gap-1 mb-1">
              <Target className="w-3 h-3 text-yellow-300" />
              <p className="text-xs text-sky-200 font-medium uppercase tracking-wider">Meta</p>
            </div>
            <p className="text-white font-bold text-sm line-clamp-2">{perfil.meta}</p>
          </div>

          {/* Horarios */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-blue-300" />
              <p className="text-xs text-sky-200 font-medium uppercase tracking-wider">Horarios</p>
            </div>
            <p className="text-white font-bold text-sm line-clamp-2">{perfil.horariosTexto}</p>
          </div>

          {/* Comidas */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="flex items-center gap-1 mb-1">
              <BarChart3 className="w-3 h-3 text-green-300" />
              <p className="text-xs text-sky-200 font-medium uppercase tracking-wider">Comidas</p>
            </div>
            <p className="text-white font-bold text-sm">{perfil.momentos.length} por día</p>
          </div>
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-white/20">
          <p className="text-sky-200 text-xs font-medium uppercase tracking-wider mb-2">
            Puntos clave del plan
          </p>
          <ul className="space-y-2">
            {perfil.resumenPersonal.slice(0, 2).map((punto, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                <span className="text-white/90 text-sm leading-relaxed">{punto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

