'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface AhorrarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AhorrarModal({ isOpen, onClose }: AhorrarModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full mx-4 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="relative">
          <Image
            src="/images/1920x1080_img_car_25pc_sin-icono.jpg"
            alt="Persona en kayak"
            width={1920}
            height={1080}
            className="w-full h-[300px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent">
            <div className="p-8 h-full flex flex-col justify-center text-white">
              <h2 className="text-3xl font-bold mb-4">Cuenta Ahorro Self</h2>
              <div className="bg-red-600 inline-block px-4 py-2 rounded-md mb-6 text-sm">
                ¡Subimos la remuneración!
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Cuenta Ahorro Self</h3>
            <p className="text-gray-600 mb-4">
              Si quieres ahorrar manteniendo la disponibilidad de tu dinero cada día, escoge esta cuenta remunerada:
            </p>
            <ul className="space-y-4 text-gray-600">
              <li>
                <strong>Hasta 1.480 euros al año</strong> si inviertes 60.000€ o más en fondos de nuestra lista destacada y mantienes la misma cantidad en tu Cuenta Ahorro Self. (2,47% TIN / 2,50%TAE)
              </li>
              <li>
                <strong>1,98% TIN / 2,00%TAE</strong> si inviertes 20.000€ o más en fondos y/o ETFs y/o planes de pensiones.
              </li>
              <li>
                <strong>0,99% TIN / 1,00%TAE</strong> sin condiciones.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Depósitos</h3>
            <p className="text-gray-600 mb-4">
              Tu dinero en libertad. Sin comisiones de ningún tipo, abono trimestral de intereses y puedes cancelarlos anticipadamente.
            </p>
            <p className="text-gray-600">
              Te ofrecemos distintos plazos para que escojas el que prefieras: 3 meses, 6 meses y 12 meses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 