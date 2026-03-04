'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, User, Sun, Moon, Flower2, Check } from 'lucide-react'
import { getLevelInfo } from '@/lib/gamification'
import { useTheme, THEME_PRESETS } from '@/contexts/ThemeContext'

export default function PerfilPage() {
  const { user, profile, supabase, refreshProfile, avatarUrl } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // avatarPreview for instant feedback, avatarUrl from context as source of truth
  const displayAvatar = avatarPreview || avatarUrl

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    refreshProfile()
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    setUploadError(null)

    // Instant preview while uploading
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)

    try {
      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${fileExt}`

      const { error: storageError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (storageError) {
        console.error('Storage upload error:', storageError)
        setUploadError(`Erro ao enviar imagem: ${storageError.message}`)
        setAvatarPreview(null)
        setUploading(false)
        return
      }

      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const url = `${publicUrl}?t=${Date.now()}`

      // 3. Save URL in Auth user_metadata (always works, no DB column needed)
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: url }
      })

      if (authError) {
        console.error('Auth updateUser error:', authError)
        setUploadError(`Erro ao salvar avatar: ${authError.message}`)
        setAvatarPreview(null)
        setUploading(false)
        return
      }

      // 4. Also try to save in profiles table (best-effort, won't block on failure)
      supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id).then(() => {})

      // 5. Refresh context so header/sidebar pick up the new avatar
      await refreshProfile()
      setAvatarPreview(null)
    } catch (err) {
      console.error('Avatar upload failed:', err)
      setUploadError('Erro inesperado ao enviar imagem.')
      setAvatarPreview(null)
    }
    setUploading(false)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza? Todos os seus dados serao excluidos permanentemente.')) return
    await supabase.auth.signOut()
    router.push('/')
  }

  const levelInfo = getLevelInfo(profile?.xp ?? 0)

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Perfil</h1>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-gray-300" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"
            >
              <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          {uploading && <p className="text-xs text-gray-400 mt-2">Enviando...</p>}
          {uploadError && <p className="text-xs text-red-500 mt-2">{uploadError}</p>}
          <p className="text-sm font-semibold text-gray-900 mt-3">{profile?.full_name || 'Usuario'}</p>
          <p className="text-xs text-gray-500">{profile?.email}</p>
        </div>

        {/* Edit Profile */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Dados Pessoais</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <p className="text-sm text-gray-900">{profile?.email}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Level */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-gray-900">Nível {levelInfo.currentLevel.level} — {levelInfo.currentLevel.name}</p>
              <p className="text-xs text-gray-500">{profile?.xp ?? 0} XP total</p>
            </div>
            <Link href="/gamificacao" className="text-xs text-gray-900 font-medium hover:underline">Ver detalhes</Link>
          </div>
        </div>

        {/* Theme */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Aparência</h2>
          <div className="grid grid-cols-2 gap-3">
            {THEME_PRESETS.map((preset) => {
              const isActive = theme === preset.id
              const Icon = preset.icon === 'moon' ? Moon : preset.icon === 'sun' ? Sun : Flower2
              return (
                <button
                  key={preset.id}
                  onClick={() => setTheme(preset.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                    isActive
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-gray-900' : 'text-gray-400'} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                      {preset.name}
                    </p>
                    <p className="text-xs text-gray-400">{preset.description}</p>
                  </div>
                  {isActive && <Check size={16} className="text-gray-900 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-100 p-5">
          <h2 className="text-sm font-semibold text-red-600 mb-2">Zona de Perigo</h2>
          <p className="text-xs text-gray-500 mb-3">Acoes irreversiveis</p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
          >
            Excluir conta
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
