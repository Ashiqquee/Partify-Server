const Chat = require('../models/chats')
const Message = require('../models/messages');

module.exports = {


     createChat : async (req, res) => {
        try {
            const { providerId } = req.body;
            

            const { id } = req.payload;
         
            let isChat = await Chat.findOne({
                userId: id,
                providerId: providerId
            }).populate('userId').populate('providerId');

            if (isChat) return res.status(200).json({ chat: isChat, });

            
            const chat = await Chat.create({
                userId: id,
                providerId,
            });

            return res.status(200).json({ chat})

        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });
        }

    },

    fetchUserChat:async(req,res) => {
        try {
           const {id} = req.payload;
           
            const chats = await Chat.find({ userId: id }).populate({
                path: 'providerId',
                select: 'name profilePic'
            }).populate({
                path: 'userId',
                select: 'name image'
            }).sort({ updatedAt: -1 });

          

            res.status(200).json({chats})

        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });

        }
    },

    createMessage : async(req,res) => {
        try {
         
            const {role,id} = req.payload;
            const  {chatId,content} = req.body;
            const senderType = role === 'user' ? 'users' : 'provider';
            const message = await Message.create({
                content,
                senderType,
                senderId:id,
                chatId,
            });

            await Chat.updateOne({_id:chatId},{$set:{latestMessage:message._id}});
        
            
            res.status(200).json({message})

        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });

        }
    },
    getMessages:async(req,res) => {
        try {
            
          const {chatId} = req.params;
            
            const messages = await Message.find({ chatId }).populate('senderId');

         

            res.status(200).json({messages});
          
        } catch (error) {
            
        }
    },
    fetchProviderChat: async (req, res) => {
        try {
            const { id } = req.payload;

            const chats = await Chat.find({ providerId: id }).populate({
                path: 'userId',
                select: 'name image'
            }).populate({
                path: 'providerId',
                select: 'name profilePic'
            }).sort({ updatedAt: -1 })

        

            res.status(200).json({ chats })

        } catch (error) {
            res.status(500).json({ errMsg: "Something went wrong" });

        }
    },

}