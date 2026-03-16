'use client';

import React from 'react';
import {
  Bell,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  History,
  AlertTriangle,
  Calendar,
  Trash2,
  Clock,
  Gift,
  ImageIcon,
  Eye,
  EyeOff,
  Upload,
  CalendarDays,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, toBCP47 } from '@/lib/utils';
import {
  getPushTemplates,
  TEMPLATE_COLOR_MAP,
  formatScheduleDate,
  formatExpiresAt,
} from './types';
import type {
  PushHistoryItem,
  ScheduledPush,
  SendResult,
  NotificationTemplate,
} from './types';

interface SendTabProps {
  merchantShopName?: string;
  // Composer
  title: string;
  body: string;
  sending: boolean;
  sendResult: SendResult | null;
  setSendResult: (v: SendResult | null) => void;
  onTitleChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onSend: () => void;
  onApplyTemplate: (t: NotificationTemplate) => void;
  // Offer
  offerDescription: string;
  setOfferDescription: (v: string) => void;
  offerImageUrl: string;
  setOfferImageUrl: (v: string) => void;
  offerDurationType: 'today' | 'tomorrow' | 'custom';
  setOfferDurationType: (v: 'today' | 'tomorrow' | 'custom') => void;
  offerCustomDate: string;
  setOfferCustomDate: (v: string) => void;
  uploadingImage: boolean;
  showImageOption: boolean;
  setShowImageOption: (v: boolean) => void;
  showOfferDetails: boolean;
  setShowOfferDetails: (v: boolean) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Active offer
  offerActive: boolean;
  offerExpiresAt: string | null;
  currentOfferTitle: string;
  onDeactivateOffer: () => void;
  onShowOfferModal: () => void;
  // Schedule
  showSchedule: boolean;
  setShowSchedule: (v: boolean) => void;
  scheduleDate: string;
  setScheduleDate: (v: string) => void;
  scheduleTime: '10:00' | '18:00';
  setScheduleTime: (v: '10:00' | '18:00') => void;
  scheduling: boolean;
  onSchedule: () => void;
  // Scheduled list
  scheduledPushes: ScheduledPush[];
  loadingScheduled: boolean;
  onCancelScheduled: (id: string) => void;
  // History
  pushHistory: PushHistoryItem[];
  loadingHistory: boolean;
}

export default function SendTab(props: SendTabProps) {
  const {
    merchantShopName,
    title, body, sending, sendResult, setSendResult,
    onTitleChange, onBodyChange, onSend, onApplyTemplate,
    offerDescription, setOfferDescription, offerImageUrl, setOfferImageUrl,
    offerDurationType, setOfferDurationType, offerCustomDate, setOfferCustomDate,
    uploadingImage, showImageOption, setShowImageOption,
    showOfferDetails, setShowOfferDetails, onImageUpload,
    offerActive, offerExpiresAt, currentOfferTitle, onDeactivateOffer, onShowOfferModal,
    showSchedule, setShowSchedule, scheduleDate, setScheduleDate,
    scheduleTime, setScheduleTime, scheduling, onSchedule,
    scheduledPushes, loadingScheduled, onCancelScheduled,
    pushHistory, loadingHistory,
  } = props;

  const locale = useLocale();
  const t = useTranslations('marketing.send');
  const tTemplates = useTranslations('marketing.templates');
  const [showHistory, setShowHistory] = React.useState(false);
  const templates = React.useMemo(() => getPushTemplates((key) => tTemplates(key)), [tTemplates]);

  return (
    <>
      {/* Scheduled Pushes */}
      {!loadingScheduled && scheduledPushes.length > 0 && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-3 mb-4">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            {t('scheduled')}
          </h3>
          <div className="space-y-2">
            {scheduledPushes.map((push) => (
              <div key={push.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-blue-100">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{push.title}</p>
                  <p className="text-sm text-gray-500">
                    {formatScheduleDate(push.scheduled_date, locale)} {t('at')} {formatTime(push.scheduled_time, locale)}
                  </p>
                </div>
                <button
                  onClick={() => onCancelScheduled(push.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Composer */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        {/* Templates Grid */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">{t('quickTemplates')}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onApplyTemplate(template)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${TEMPLATE_COLOR_MAP[template.color] || TEMPLATE_COLOR_MAP.blue}`}
              >
                <template.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-semibold truncate">{template.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Composer Form */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left: Form */}
          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('notificationTitle')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder={t('titlePlaceholder')}
                maxLength={50}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none text-sm"
              />
              <p className={`text-[10px] mt-0.5 text-right ${title.length > 40 ? 'text-amber-600' : 'text-gray-400'}`}>
                {title.length}/50 {title.length <= 30 && title.length > 0 && '✓'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">{t('shortMessage')}</label>
              <textarea
                value={body}
                onChange={(e) => onBodyChange(e.target.value)}
                placeholder={t('bodyPlaceholder')}
                maxLength={150}
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none text-sm"
              />
              <p className={`text-[10px] mt-0.5 text-right ${body.length > 100 ? 'text-amber-600' : 'text-gray-400'}`}>
                {body.length}/150 {body.length <= 80 && body.length > 0 && '✓'}
              </p>
            </div>

            {/* Collapsible offer section */}
            <div className="border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowOfferDetails(!showOfferDetails)}
                className="flex items-center gap-2 w-full text-left group"
              >
                <Gift className="w-4 h-4 text-pink-500" />
                <span className="text-xs font-bold text-gray-700 flex-1">{t('addOffer')}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showOfferDetails ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showOfferDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-3">
                      <p className="text-[10px] text-gray-500">{t('offerVisibleOnCard')}</p>

                      {/* Warning if offer already active */}
                      {offerActive && offerExpiresAt && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-amber-800">{t('offerAlreadyActive')}</p>
                            <p className="text-[10px] text-amber-700 mt-0.5">
                              {t('offerAlreadyActiveDesc', { title: currentOfferTitle, expires: formatExpiresAt(offerExpiresAt, locale) })}
                            </p>
                          </div>
                        </div>
                      )}

                      <textarea
                        value={offerDescription}
                        onChange={(e) => setOfferDescription(e.target.value)}
                        placeholder={t('describeOffer')}
                        maxLength={300}
                        rows={2}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all outline-none resize-none text-sm"
                      />
                      <p className={`text-[10px] text-right ${offerDescription.length > 250 ? 'text-pink-600' : 'text-gray-400'}`}>
                        {offerDescription.length}/300
                      </p>

                      {/* Image Upload */}
                      <div>
                        <button
                          type="button"
                          onClick={() => setShowImageOption(!showImageOption)}
                          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{t('imageOptional')}</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showImageOption ? 'rotate-180' : ''}`} />
                        </button>

                        {showImageOption && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            {offerImageUrl ? (
                              <div className="relative">
                                <img
                                  src={offerImageUrl}
                                  alt={t('preview')}
                                  className="w-full h-28 object-cover rounded-lg"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '';
                                    setOfferImageUrl('');
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setOfferImageUrl('')}
                                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-pink-300 hover:bg-pink-50/50 transition-all">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={onImageUpload}
                                  className="hidden"
                                  disabled={uploadingImage}
                                />
                                {uploadingImage ? (
                                  <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                                ) : (
                                  <>
                                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-xs text-gray-500">{t('clickToUpload')}</span>
                                    <span className="text-[10px] text-gray-400 mt-0.5">{t('imageFormats')}</span>
                                  </>
                                )}
                              </label>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Duration Selection */}
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1.5">{t('offerDuration')}</label>
                        <div className="flex gap-1.5">
                          {(['today', 'tomorrow', 'custom'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setOfferDurationType(type)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                                offerDurationType === type
                                  ? 'bg-pink-500 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {type === 'custom' && <CalendarDays className="w-3.5 h-3.5" />}
                              {type === 'today' ? t('today') : type === 'tomorrow' ? t('tomorrow') : t('date')}
                            </button>
                          ))}
                        </div>

                        {offerDurationType === 'custom' && (
                          <div className="mt-2">
                            <input
                              type="date"
                              value={offerCustomDate}
                              onChange={(e) => setOfferCustomDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-3 py-2 rounded-lg border border-pink-200 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Notification Preview */}
          {(title || body) && (
            <div className="md:w-64 flex-shrink-0">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 sticky top-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Bell className="w-3 h-3" />
                  {t('preview')}
                </p>
                <div className="bg-white rounded-lg shadow-md p-2.5 flex gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-black italic">Q</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-900">{merchantShopName || t('yourShop')}</span>
                      <span className="text-[9px] text-gray-400">{t('now')}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-800 truncate">{title || t('titlePlaceholderPreview')}</p>
                    <p className="text-[10px] text-gray-600 line-clamp-2">{body || t('bodyPlaceholderPreview')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Result message */}
        <AnimatePresence>
          {sendResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 flex items-center gap-3 p-4 rounded-xl ${
                sendResult.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}
            >
              {sendResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <p className="flex-1 font-semibold text-sm">
                {sendResult.message || (sendResult.sent === 0
                  ? t('noSubscribers')
                  : t('notificationsSent', { count: sendResult.sent! }))}
              </p>
              <button onClick={() => setSendResult(null)} className="p-1 hover:bg-black/10 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Schedule Section */}
        <AnimatePresence>
          {showSchedule && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4"
            >
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm font-bold text-blue-900 mb-3">{t('scheduleTitle')}</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-blue-700 mb-1">{t('dateLabel')}</label>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 rounded-lg border border-blue-200 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-blue-700 mb-1">{t('timeLabel')}</label>
                    <div className="flex gap-2">
                      {(['10:00', '18:00'] as const).map((time) => (
                        <button
                          key={time}
                          onClick={() => setScheduleTime(time)}
                          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                            scheduleTime === time
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-blue-700 border border-blue-200'
                          }`}
                        >
                          {formatTime(time, locale)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <div className="flex-1 relative">
            <button
              onClick={onSend}
              disabled={!title.trim() || !body.trim() || sending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('sending')}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t('send')}
                </>
              )}
            </button>
            <div className="absolute -right-2 -top-2">
              <div className="relative group">
                <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow cursor-help">
                  <AlertTriangle className="w-3 h-3" />
                </div>
                <div className="absolute right-0 top-7 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <p className="font-bold text-red-400">{t('warning')}</p>
                  <p>{t('warningFrequency')}</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSchedule(!showSchedule)}
            disabled={!title.trim() || !body.trim()}
            className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              showSchedule
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            {showSchedule ? t('cancelSchedule') : t('later')}
          </button>
        </div>

        {/* Schedule Confirm */}
        <AnimatePresence>
          {showSchedule && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <button
                onClick={onSchedule}
                disabled={!title.trim() || !body.trim() || scheduling}
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('scheduling')}
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    {t('confirmSchedule')}
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Offer Indicator */}
      {offerActive && offerExpiresAt && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Gift className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-emerald-900 text-sm">{currentOfferTitle || t('activeOffer')}</p>
                <p className="text-xs text-emerald-700">{t('until', { date: formatExpiresAt(offerExpiresAt, locale) })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onShowOfferModal}
                className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                {t('view')}
              </button>
              <button
                onClick={onDeactivateOffer}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
              >
                <EyeOff className="w-3.5 h-3.5" />
                {t('stop')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            {t('history')}
            {pushHistory.length > 0 && (
              <span className="text-xs font-medium text-gray-400">({pushHistory.length})</span>
            )}
          </h2>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : pushHistory.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">{t('noNotifications')}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pushHistory.map((item) => {
                      const date = new Date(item.created_at);
                      return (
                        <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate text-sm">{item.title}</p>
                              <p className="text-xs text-gray-600 line-clamp-1">{item.body}</p>
                              <span className="text-[10px] text-gray-400 mt-1 block">
                                {date.toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="font-bold text-sm">{item.sent_count}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
