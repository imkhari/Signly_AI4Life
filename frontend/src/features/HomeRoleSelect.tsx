import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Stethoscope, User } from 'lucide-react';
import { A11yControls, Button, Modal } from '../ui';
import { vi } from '../i18n/vi';

export const HomeRoleSelect: React.FC = () => {
  const [helpOpen, setHelpOpen] = useState(false);
  return <main lang="vi" className="min-h-screen bg-canvas px-4 py-6 sm:p-10">
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-5 border-b border-gray-300 pb-6">
        <div className="max-w-xl"><h1 className="text-4xl font-bold text-ink">{vi.app.title}</h1>
          <p className="text-lg text-mute mt-3 leading-relaxed">{vi.app.slogan}</p></div>
        <A11yControls onCallHelp={() => setHelpOpen(true)} />
      </header>
      <section aria-labelledby="role-select-title">
        <h2 id="role-select-title" className="text-2xl font-bold mb-5">{vi.roles.selectRole}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {([{path:'/patient',title:vi.roles.patient,description:vi.roles.patientDesc,action:vi.presentation.openPatient,Icon:User},
            {path:'/nurse',title:vi.roles.nurse,description:vi.roles.nurseDesc,action:vi.presentation.openNurse,Icon:Stethoscope}]).map(role =>
            <Link key={role.path} to={role.path} className="bg-paper border border-gray-300 rounded-2xl p-6 sm:p-8 flex flex-col items-start gap-4 hover:border-action">
              <role.Icon aria-hidden="true" className="w-10 h-10 text-action" />
              <h3 className="text-2xl font-bold">{role.title}</h3>
              <p className="text-lg text-mute flex-1">{role.description}</p>
              <span className="mt-3 min-h-[64px] flex items-center justify-between gap-3 w-full border-t border-gray-200 pt-4 font-bold text-action text-lg">{role.action}<ArrowRight aria-hidden="true" className="w-6 h-6 shrink-0" /></span>
            </Link>)}
        </div>
      </section>
      <section className="border-l-4 border-action pl-5 space-y-3" aria-labelledby="pairing-guide">
        <h2 id="pairing-guide" className="text-xl font-bold">{vi.presentation.homeGuide}</h2>
        <ol className="list-decimal ml-6 space-y-2 text-lg text-mute"><li>{vi.presentation.nurseGuide}</li><li>{vi.presentation.patientGuide}</li></ol>
      </section>
      <footer className="border-t border-gray-300 pt-5 space-y-3">
        <p className="text-mute">{vi.app.disclaimer}</p>
        <details><summary className="cursor-pointer min-h-[64px] flex items-center font-semibold text-action">{vi.presentation.tools}</summary>
          <div className="flex flex-wrap gap-4"><Link className="min-h-[64px] inline-flex items-center underline text-action" to="/demo">{vi.presentation.demo}</Link><Link className="min-h-[64px] inline-flex items-center underline text-action" to="/vsl-validation">{vi.presentation.validation}</Link></div>
        </details>
      </footer>
    </div>
    <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={vi.interpreter.modalTitle}>
      <p className="text-xl mb-5">{vi.presentation.help}</p><Button onClick={() => setHelpOpen(false)}>{vi.common.close}</Button>
    </Modal>
  </main>;
};
