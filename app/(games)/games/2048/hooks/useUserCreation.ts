'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function useUserCreation() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Verificar si el usuario tiene datos de Twitch
      const user = session.user as any;
      
      if (user.twitchId && user.twitchLogin) {
        console.log('🔧 Creating/updating user in database:', {
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
            console.log('✅ User created/updated successfully:', data.user);
          } else {
            console.error('❌ Error creating user:', data.error);
          }
        })
        .catch(error => {
          console.error('❌ Error creating user:', error);
        });
      }
    }
  }, [session, status]);

  return { session, status };
}
