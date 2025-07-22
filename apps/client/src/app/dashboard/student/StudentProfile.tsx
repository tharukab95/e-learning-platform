import React from 'react';
import Skeleton from 'react-loading-skeleton';

interface StudentProfileProps {
  profile: any;
  profileForm: any;
  editingProfile: boolean;
  loadingProfile: boolean;
  handleProfileEdit: () => void;
  handleProfileCancel: () => void;
  handleProfileChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleProfileSave: () => void;
  handleProfileImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  deleteProfileImage: () => void;
}

const StudentProfile: React.FC<StudentProfileProps> = ({
  profile,
  profileForm,
  editingProfile,
  loadingProfile,
  handleProfileEdit,
  handleProfileCancel,
  handleProfileChange,
  handleProfileSave,
  handleProfileImageChange,
  fileInputRef,
  deleteProfileImage,
}) => (
  <section className="bg-white/80 rounded-xl shadow p-8 max-w-4xl mx-auto w-full relative">
    {loadingProfile ? (
      <div className="flex flex-col items-center mb-4 w-full animate-pulse">
        <div className="relative w-28 h-28 flex items-center justify-center mx-auto mb-4">
          <Skeleton circle height={112} width={112} />
        </div>
        <div className="w-full flex flex-col items-start">
          <Skeleton height={28} width={160} className="mb-2" />
          <Skeleton height={18} width={220} className="mb-4" />
          <Skeleton height={20} width={300} className="mb-2" />
          <Skeleton height={20} width={300} className="mb-2" />
          <Skeleton height={40} width={300} className="mb-2" />
        </div>
      </div>
    ) : (
      <>
        {/* Edit icon top right */}
        <button
          className="absolute top-4 right-4 btn btn-xs btn-outline flex items-center justify-center"
          onClick={handleProfileEdit}
          aria-label="Edit Profile"
        >
          {/* Pencil icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 12.362-12.303z"
            />
          </svg>
        </button>
        <div className="flex flex-col items-center mb-4 w-full">
          <div className="relative w-28 h-28 flex items-center justify-center mx-auto">
            {profile?.image ? (
              <img
                src={profile.image}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border mx-auto"
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center border mx-auto relative cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-white bg-opacity-80 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                  Upload Photo
                </span>
              </div>
            )}
            {/* Only show delete icon if editingProfile is true and profile image exists */}
            {profile?.image && editingProfile && (
              <button
                className="absolute top-0 left-0 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-700"
                onClick={deleteProfileImage}
                title="Delete Profile Image"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleProfileImageChange}
            />
          </div>
        </div>
        <div className="w-full">
          <span className="text-2xl font-bold text-indigo-900">
            {profile?.name}
          </span>
          <div className="text-gray-500 text-sm mb-4">{profile?.email}</div>
          {editingProfile ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name || ''}
                  onChange={handleProfileChange}
                  className="input input-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone"
                  value={profileForm.phone || ''}
                  onChange={handleProfileChange}
                  className="input input-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={profileForm.address || ''}
                  onChange={handleProfileChange}
                  className="textarea textarea-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary px-3 py-2"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  About Me
                </label>
                <textarea
                  name="about"
                  value={profileForm.about || ''}
                  onChange={handleProfileChange}
                  className="textarea textarea-bordered w-full bg-gray-50 border-2 border-gray-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary px-3 py-2"
                  rows={3}
                />
              </div>
              {/* Add spacing before the buttons and align with theme */}
              <div className="flex gap-3 justify-end mt-8">
                <button
                  className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 rounded-full px-6 py-2 transition"
                  onClick={handleProfileCancel}
                >
                  Cancel
                </button>
                <button
                  className="btn bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold rounded-full px-8 py-2 shadow hover:from-blue-700 hover:to-indigo-800 transition"
                  onClick={handleProfileSave}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Phone:</span>
                <span>
                  {profile?.phone || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Address:</span>
                <span>
                  {profile?.address || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </span>
              </div>
              <div>
                <span className="font-semibold">About Me:</span>
                <div className="text-gray-700 whitespace-pre-line mt-1">
                  {profile?.about || (
                    <span className="text-gray-400">Not set</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    )}
  </section>
);

export default StudentProfile;
