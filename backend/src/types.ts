export interface User {
  id: string;
  name: string;
  bio: string;
  profileImageUrl: string;
  phoneNumber: string; 
  password: string;
  firstDegreeFriendIds: string[]; // IDs of their 1st degree friends
  // Stores IDs of 2nd-degree connections that have been approved for interaction by the current user.
  // Approval is a one-time event per 2nd-degree connection.
  approvedSecondDegreeConnections: Set<string>; 
}

export interface Hangout {
  id: string;
  hostId: string;
  participants: User[]; // Full user objects for easier display
  acceptedBy: string[]; // IDs of users who have accepted
  rejectedBy: string[]; // IDs of users who have rejected
  activityDescription: string;
  details?: string; // Optional details field
  timestamp: Date;
  status: 'pending_approval' | 'pending' | 'confirmed' | 'cancelled';
}

// For OTP step - no longer used in main flow but kept for potential future use
export interface OtpData {
  phoneNumber: string;
  generatedOtp: string | null;
}

// For friend selection step
export interface PotentialFriend extends User {
  // no extra fields needed for now, but inherits User
}

export interface ConnectionApprovalRequest {
  id: string;
  requesterId: string; // User who wants to connect with the 2nd degree
  requestedId: string;  // The 2nd degree user
  approverId: string;   // The mutual 1st degree friend
  status: 'pending' | 'approved' | 'rejected';
  hangoutId: string; // The hangout this request is for
}