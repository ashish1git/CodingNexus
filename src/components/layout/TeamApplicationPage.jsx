import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Send, ShieldCheck, Users, Mail, Phone, Github, Linkedin, Target, Code, Award, Briefcase, Calendar, Heart, AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { teamApplicationService } from '../../services/teamApplicationService';

const initialForm = {
  // Basic Information
  fullName: '',
  branch: '',
  year: '',
  department: '',
  email: '',
  phoneNumber: '',
  // Profiles
  githubProfile: '',
  linkedinProfile: '',
  portfolioWebsite: '',
  // Resume
  resumeLink: '',
  // Technical Skills
  technicalSkills: [],
  technicalProficiency: '3',
  // Programming & DSA
  preferredLanguage: '',
  practiceDSA: '',
  dsaPlatforms: '',
  problemSolvingLevel: '3',
  // Projects
  hasProjects: 'yes',
  projectLinks: '',
  proudestProject: '',
  // Motivation
  whyJoinCodingNexus: '',
  technicalLearning: '',
  // Commitment
  hoursPerWeek: '',
  teamworkCommitted: false,
  technicalTaskWilling: false,
  // Availability
  offlineAvailable: false,
  interestedDomain: '',
  // Additional
  additionalInfo: '',
  // Declaration
  declarationAgreed: false
};

const technicalSkillsOptions = [
  'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'Angular', 'Vue.js',
  'SQL', 'MongoDB', 'AWS', 'Docker', 'Git', 'Linux', 'Figma', 'TypeScript'
];

const TeamApplicationPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      technicalSkills: prev.technicalSkills.includes(skill)
        ? prev.technicalSkills.filter((s) => s !== skill)
        : [...prev.technicalSkills, skill]
    }));
  };

  const validateForm = () => {
    // Validate email format only if provided
    if (form.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) return 'Invalid email address format';
    }
    
    // Validate phone number length only if provided
    if (form.phoneNumber?.trim() && form.phoneNumber.trim().length < 8) {
      return 'Phone number must be at least 8 digits';
    }
    
    // Validate hours per week only if provided
    if (form.hoursPerWeek && (isNaN(form.hoursPerWeek) || form.hoursPerWeek < 1)) {
      return 'Please enter valid hours per week';
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setIsSubmitting(true);

      await teamApplicationService.submitApplication({
        ...form,
        technicalSkills: form.technicalSkills,
        technicalProficiency: parseInt(form.technicalProficiency),
        problemSolvingLevel: parseInt(form.problemSolvingLevel),
        hoursPerWeek: parseInt(form.hoursPerWeek)
      });

      setShowSuccessModal(true);
      setForm(initialForm);
    } catch (submitError) {
      toast.error(submitError.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const SuccessModal = () => (
    <div className={`fixed inset-0 z-50 ${showSuccessModal ? 'flex' : 'hidden'} items-center justify-center bg-black/50 backdrop-blur-sm p-4`}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-end mb-4">
          <button onClick={() => { setShowSuccessModal(false); navigate('/'); }} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Application Submitted!</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-gray-700 leading-relaxed text-sm">
              🎉 <span className="font-semibold">Your response has been sent to Coding Nexus Team!</span>
            </p>
            <p className="text-gray-600 mt-3 text-sm">
              We will review your application and reach out to you very soon via email or phone.
            </p>
            <p className="text-gray-600 mt-2 text-sm">
              <span className="font-semibold">Note:</span> There might be a small discussion and mini interview regarding your application.
            </p>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>📧 Check your email for updates</p>
            <p>📱 Keep your phone accessible</p>
            <p>⏱️ Expected response: within few hours</p>
          </div>

          <button
            onClick={() => { setShowSuccessModal(false); navigate('/'); }}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-slate-700 hover:text-blue-700 transition-colors font-medium mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-700 p-8 sm:p-12 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">Coding Nexus Team Application</h1>
                <p className="text-blue-50 mt-2">Join our passionate tech community - Fill out your complete profile</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 sm:p-12 space-y-12">
            {/* Basic Information */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-600" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={onChange}
                  placeholder="Full Name *"
                  className="px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="branch"
                  value={form.branch}
                  onChange={onChange}
                  placeholder="Branch & Year (e.g., CS-SE) *"
                  className="px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="year"
                  value={form.year}
                  onChange={onChange}
                  placeholder="Year (FE / SE / TE / BE)"
                  className="px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  name="department"
                  value={form.department}
                  onChange={onChange}
                  placeholder="Department"
                  className="px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  placeholder="Email Address *"
                  className="md:col-span-2 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={onChange}
                  placeholder="Phone Number (WhatsApp preferred) *"
                  className="md:col-span-2 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </section>

            {/* Profiles */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-blue-600" />
                Your Profiles
              </h2>
              <div className="space-y-4">
                <input
                  type="url"
                  name="githubProfile"
                  value={form.githubProfile}
                  onChange={onChange}
                  placeholder="GitHub Profile Link *"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  name="linkedinProfile"
                  value={form.linkedinProfile}
                  onChange={onChange}
                  placeholder="LinkedIn Profile Link *"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="url"
                  name="portfolioWebsite"
                  value={form.portfolioWebsite}
                  onChange={onChange}
                  placeholder="Portfolio / Personal Website *"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </section>

            {/* Resume */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Award className="w-6 h-6 text-blue-600" />
                Resume
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">Upload your resume to Google Drive and share the public access link (Anyone with link can view)</p>
              </div>
              <input
                type="url"
                name="resumeLink"
                value={form.resumeLink}
                onChange={onChange}
                placeholder="Google Drive Resume Link *"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </section>

            {/* Technical Skills */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Code className="w-6 h-6 text-blue-600" />
                Technical Skills
              </h2>
              <div className="mb-6">
                <p className="text-sm font-semibold text-slate-700 mb-3">Which technologies are you familiar with? *</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {technicalSkillsOptions.map((skill) => (
                    <label key={skill} className="flex items-center gap-2 p-3 border border-slate-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={form.technicalSkills.includes(skill)}
                        onChange={() => toggleSkill(skill)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm font-medium text-slate-700">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Technical Proficiency (1-5) *</label>
                  <select
                    name="technicalProficiency"
                    value={form.technicalProficiency}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 - Beginner</option>
                    <option value="2">2 - Basic</option>
                    <option value="3">3 - Intermediate</option>
                    <option value="4">4 - Advanced</option>
                    <option value="5">5 - Expert</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Programming & DSA */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Code className="w-6 h-6 text-blue-600" />
                Programming & DSA
              </h2>
              <div className="space-y-6">
                <input
                  type="text"
                  name="preferredLanguage"
                  value={form.preferredLanguage}
                  onChange={onChange}
                  placeholder="Preferred Language (Java / C++ / Python / Other) *"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Do you practice DSA? *</label>
                  <select
                    name="practiceDSA"
                    value={form.practiceDSA}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="Regularly">Regularly</option>
                    <option value="Sometimes">Sometimes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <input
                  type="text"
                  name="dsaPlatforms"
                  value={form.dsaPlatforms}
                  onChange={onChange}
                  placeholder="DSA Platforms (LeetCode, CodeChef, Codeforces, etc.)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Problem Solving Comfort Level (1-5) *</label>
                  <select
                    name="problemSolvingLevel"
                    value={form.problemSolvingLevel}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1 - Beginner</option>
                    <option value="2">2 - Basic</option>
                    <option value="3">3 - Intermediate</option>
                    <option value="4">4 - Confident</option>
                    <option value="5">5 - Expert</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Projects */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Target className="w-6 h-6 text-blue-600" />
                Projects
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Have you built any projects? *</label>
                  <select
                    name="hasProjects"
                    value={form.hasProjects}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <textarea
                  name="projectLinks"
                  value={form.projectLinks}
                  onChange={onChange}
                  placeholder="Share links to your projects (GitHub / Live hosted links)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                />

                <textarea
                  name="proudestProject"
                  value={form.proudestProject}
                  onChange={onChange}
                  placeholder="Describe your most proud project: What you built, your role, challenges faced, and what you learned"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32"
                />
              </div>
            </section>

            {/* Motivation */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Heart className="w-6 h-6 text-blue-600" />
                Motivation & Learning
              </h2>
              <div className="space-y-6">
                <textarea
                  name="whyJoinCodingNexus"
                  value={form.whyJoinCodingNexus}
                  onChange={onChange}
                  placeholder="Why do you want to join Coding Nexus? *"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                />

                <textarea
                  name="technicalLearning"
                  value={form.technicalLearning}
                  onChange={onChange}
                  placeholder="Describe something technical you learned on your own without guidance"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-24"
                />
              </div>
            </section>

            {/* Commitment */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                Commitment & Availability
              </h2>
              <div className="space-y-6">
                <input
                  type="number"
                  name="hoursPerWeek"
                  value={form.hoursPerWeek}
                  onChange={onChange}
                  placeholder="How many hours per week can you contribute? *"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <label className="flex items-center gap-3 p-4 border border-slate-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="checkbox"
                    name="teamworkCommitted"
                    checked={form.teamworkCommitted}
                    onChange={onChange}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-slate-700 font-medium">I'm comfortable working in a team and meeting deadlines *</span>
                </label>

                <label className="flex items-center gap-3 p-4 border border-slate-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="checkbox"
                    name="technicalTaskWilling"
                    checked={form.technicalTaskWilling}
                    onChange={onChange}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-slate-700 font-medium">I'm willing to complete a technical task if shortlisted *</span>
                </label>

                <label className="flex items-center gap-3 p-4 border border-slate-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="checkbox"
                    name="offlineAvailable"
                    checked={form.offlineAvailable}
                    onChange={onChange}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-slate-700 font-medium">I'm available for offline meetings and events if required *</span>
                </label>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Which domain are you most interested in? *</label>
                  <select
                    name="interestedDomain"
                    value={form.interestedDomain}
                    onChange={onChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select domain...</option>
                    <option value="Frontend">Frontend</option>
                    <option value="Backend">Backend</option>
                    <option value="Full Stack">Full Stack</option>
                    <option value="Competitive Programming">Competitive Programming</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Additional Information */}
            <section>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Additional Information</h2>
              <textarea
                name="additionalInfo"
                value={form.additionalInfo}
                onChange={onChange}
                placeholder="Anything else you would like us to know about you?"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20"
              />
            </section>

            {/* Declaration */}
            <section className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-amber-600" />
                Final Declaration
              </h2>
              <label className="flex items-start gap-3 p-4 border border-amber-300 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                <input
                  type="checkbox"
                  name="declarationAgreed"
                  checked={form.declarationAgreed}
                  onChange={onChange}
                  className="w-5 h-5 rounded mt-1 flex-shrink-0"
                />
                <span className="text-slate-700 leading-relaxed">
                  I confirm that <span className="font-bold">I am serious about learning, contributing, and building consistently</span> with Coding Nexus Team. I understand that this requires dedication and commitment. *
                </span>
              </label>
            </section>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>

      <SuccessModal />
    </div>
  );
};

export default TeamApplicationPage;
