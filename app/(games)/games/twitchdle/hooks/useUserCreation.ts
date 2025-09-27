'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function useUserCreation() {
  const { data: session, status } = useSession();
  const hasCreatedUser = useRef(false);

  useEffect(() => {
    // Solo ejecutar una vez cuando el usuario esté autenticado
    if (status === 'authenticated' && session?.user && !hasCreatedUser.current) {
      const user = session.user as any;
      
      if (user.twitchId && user.twitchLogin) {
        hasCreatedUser.current = true; // Marcar como ejecutado
        
        console.log('🔧 Creating/updating user in database (one-time):', {
          userId: user.id,
          twitchId: user.twitchId,
          twitchLogin: user.twitchLogin,
          displayName: user.displayName,
          avatarUrl: user.image
        });

        // Crear/actualizar usuario en la base de datos
        fetch('/api/auth/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            twitchId: user.twitchId,
            twitchLogin: user.twitchLogin,
            displayName: user.displayName || user.name,
            avatarUrl: user.image,
          }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('✅ User created/updated successfully (one-time):', data.user);
          } else {
            console.error('❌ Error creating user:', data.error);
            hasCreatedUser.current = false; // Reset si hay error
          }
        })
        .catch(error => {
          console.error('❌ Error creating user:', error);
          hasCreatedUser.current = false; // Reset si hay error
        });
      }
    }
  }, [status]); // Solo status para evitar re-renders innecesarios

  return { session, status };
}
