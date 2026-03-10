import React, { useState, useEffect } from 'react';
import api from './lib/api';
import { Header, Tabs } from './components/Navigation';
import { PostCard } from './components/PostCard';
import { PostModal } from './components/PostModal';
import { PostDetailModal } from './components/PostDetailModal';
import { AuthPage } from './components/AuthPage';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const checkSession = async () => {
    try {
      const { data } = await api.get('/api/users/me');
      setUser(data);
      fetchPosts();
    } catch (err) {
      setUser(null);
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data } = await api.get('/api/posts');
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await api.delete(`/api/posts/${id}`);
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.get('/logout');
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleEdit = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-text-muted">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="text-xl font-medium tracking-wide">Initializing secure session...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={checkSession} />;
  }

  const filteredPosts = activeTab === 'ALL'
    ? posts
    : posts.filter(p => p.type === activeTab);

  return (
    <div className="min-h-screen">
      <Header onOpenModal={() => setIsModalOpen(true)} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-5 py-12">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-text-muted">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="text-xl font-medium">Loading database...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-white/20">
            <ShieldAlert size={80} className="mb-6 opacity-10" />
            <p className="text-2xl font-bold">No records found</p>
            <p className="text-sm mt-2">Try switching categories or create a new post.</p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence>
              {filteredPosts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <PostCard
                    post={post}
                    onDelete={handleDelete}
                    onExpand={() => setSelectedPost(post)}
                    onEdit={handleEdit}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      <PostModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedPost(null); }}
        onSuccess={fetchPosts}
        user={user}
        editingPost={selectedPost}
      />
      <PostDetailModal
        isOpen={!!selectedPost && !isModalOpen}
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        onDelete={handleDelete}
        onEdit={(p) => { setSelectedPost(p); setIsModalOpen(true); }}
      />
    </div>
  );
}

export default App;
